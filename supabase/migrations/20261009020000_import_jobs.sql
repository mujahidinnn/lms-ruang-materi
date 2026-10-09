-- Import pipeline: jobs, cost limits, draft slides next to live ones, and
-- publish_topic() that swaps a topic's drafts in atomically.

create type public.import_status as enum ('queued', 'rendering', 'drafting', 'done', 'failed');

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  file_path text not null check (file_path ~ '^(migrasi/[a-z0-9-]+|[0-9a-f-]{36})\.pptx$'),
  original_name text not null default '',
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  provider text not null,
  model text not null,
  slide_count int not null check (slide_count between 1 and 80),
  status public.import_status not null default 'queued',
  error text,
  input_tokens int,
  output_tokens int,
  prerequisites text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.import_jobs (created_at desc);

alter table public.import_jobs enable row level security;

create policy "import_jobs: admin read" on public.import_jobs
  for select to authenticated using ((select public.is_admin()));

create policy "import_jobs: admin insert" on public.import_jobs
  for insert to authenticated with check ((select public.is_admin()));

-- Lets the app drop a job whose dispatch failed, so it does not block.
create policy "import_jobs: admin delete queued" on public.import_jobs
  for delete to authenticated using ((select public.is_admin()) and status = 'queued');

-- Admins only insert; status, error and usage are written by the worker.
revoke all on public.import_jobs from anon, authenticated;
grant select, insert, delete on public.import_jobs to authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger touch_updated_at before update on public.import_jobs
  for each row execute function public.touch_updated_at();

-- Cost limits. A job counts as active for 30 minutes at most, so a crashed
-- worker or a lost dispatch cannot block imports forever (the workflow
-- times out at 20). Queued counts too: GitHub concurrency keeps only one
-- pending run, a second queued job would never start.
create or replace function public.check_import_limits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  max_per_day constant int := 10;
begin
  perform pg_advisory_xact_lock(hashtext('import_jobs'));

  if exists (
    select 1 from public.import_jobs
    where status in ('queued', 'rendering', 'drafting')
      and updated_at > now() - interval '30 minutes'
  ) then
    raise exception 'Masih ada impor yang berjalan' using errcode = 'P0001';
  end if;

  if (select count(*) from public.import_jobs where created_at > now() - interval '1 day') >= max_per_day then
    raise exception 'Batas % impor per hari tercapai', max_per_day using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger check_import_limits before insert on public.import_jobs
  for each row execute function public.check_import_limits();

-- Drafts live next to published rows until publish.
alter table public.topics add column draft_summary text;

alter table public.slides drop constraint slides_topic_id_index_key;
alter table public.slides add constraint slides_topic_id_status_index_key unique (topic_id, status, index);

-- Swaps in a topic's drafts. For every table that has drafts, the published
-- rows are replaced; tables without drafts keep their published rows.
create or replace function public.publish_topic(p_slug text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.topics;
  e public.exams;
  bank int;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin' using errcode = '42501';
  end if;

  select * into t from public.topics where slug = p_slug for update;
  if not found then
    raise exception 'Topik tidak ditemukan' using errcode = 'P0002';
  end if;

  if exists (select 1 from public.slides where topic_id = t.id and status = 'draft') then
    delete from public.slides where topic_id = t.id and status = 'published';
    update public.slides set status = 'published' where topic_id = t.id;
  end if;
  if not exists (select 1 from public.slides where topic_id = t.id) then
    raise exception 'Topik belum punya slide' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.tips where topic_id = t.id and status = 'draft') then
    delete from public.tips where topic_id = t.id and status = 'published';
    update public.tips set status = 'published' where topic_id = t.id;
  end if;

  if exists (select 1 from public.flashcards where topic_id = t.id and status = 'draft') then
    delete from public.flashcards where topic_id = t.id and status = 'published';
    update public.flashcards set status = 'published' where topic_id = t.id;
  end if;

  if exists (select 1 from public.practice_questions where topic_id = t.id and status = 'draft') then
    delete from public.practice_questions where topic_id = t.id and status = 'published';
    update public.practice_questions set status = 'published' where topic_id = t.id;
  end if;

  select * into e from public.exams where topic_id = t.id;
  if found then
    if exists (select 1 from public.exam_questions where exam_id = e.id and status = 'draft') then
      delete from public.exam_questions where exam_id = e.id and status = 'published';
      update public.exam_questions set status = 'published' where exam_id = e.id;
    end if;

    if exists (
      select 1 from public.exam_questions q
      join public.practice_questions p on p.topic_id = t.id
        and lower(btrim(p.prompt)) = lower(btrim(q.prompt))
      where q.exam_id = e.id
    ) then
      raise exception 'Ada soal ujian yang sama dengan soal latihan' using errcode = 'P0001';
    end if;

    select count(*) into bank from public.exam_questions where exam_id = e.id;
    if bank > 0 then
      if bank < 2 * e.question_count then
        raise exception 'Bank soal ujian butuh minimal % soal, baru ada %', 2 * e.question_count, bank
          using errcode = 'P0001';
      end if;
      update public.exams set status = 'published' where id = e.id;
    end if;
  end if;

  update public.topics
  set status = 'published',
      summary = coalesce(draft_summary, summary),
      draft_summary = null
  where id = t.id;
end;
$$;

revoke execute on function public.publish_topic(text) from public, anon;
grant execute on function public.publish_topic(text) to authenticated;
