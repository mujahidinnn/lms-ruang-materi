-- Final projects and opt-in certificates (spec 2026-10-21-kelas-ala-dicoding).
-- A project is a bigger code exercise owned by the topic. A certificate is
-- issued only when the learner asks, because its public page shows their
-- name; eligibility is computed on request, so passes from before this
-- migration count without a backfill.

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  status public.content_status not null default 'draft',
  kind public.code_kind not null,
  title text not null check (char_length(title) between 1 and 120),
  brief text not null default '',
  prompt text not null default '',
  starter jsonb not null default '{}',
  solution jsonb not null default '{}',
  setup text not null default '',
  tests jsonb not null default '[]' check (jsonb_typeof(tests) = 'array'),
  -- Set when the solution passed its own checks ("Uji solusi" or the worker).
  verified_at timestamptz,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (topic_id, status)
);

create table public.project_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  passed_at timestamptz not null default now(),
  code jsonb not null default '{}',
  primary key (user_id, project_id)
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  -- Copied at issue time: renaming the profile later does not rewrite it.
  name text not null check (char_length(name) between 1 and 80),
  issued_at timestamptz not null default now(),
  unique (user_id, topic_id)
);

create index on public.projects (updated_by) where updated_by is not null;
create index on public.project_progress (project_id);
create index on public.certificates (topic_id);

alter table public.projects enable row level security;
alter table public.project_progress enable row level security;
alter table public.certificates enable row level security;

create trigger set_updated_by before insert or update on public.projects
  for each row execute function public.set_updated_by();

create policy "projects: admin all" on public.projects for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "projects: read published" on public.projects for select to anon, authenticated
  using (status = 'published' and topic_id in (select id from public.topics where status = 'published'));

create policy "project_progress: read own or admin" on public.project_progress for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create trigger require_consent before insert on public.project_progress
  for each row execute function public.require_consent();
create trigger log_learning_day after insert or update of passed_at on public.project_progress
  for each row execute function public.log_learning_day();

-- Owners read and delete their certificates; nobody writes them directly.
-- The public page goes through certificate_by_code().
create policy "certificates: read own" on public.certificates for select to authenticated
  using (user_id = (select auth.uid()));
create policy "certificates: delete own" on public.certificates for delete to authenticated
  using (user_id = (select auth.uid()));

-- Records a project pass; same rules as pass_code_exercise().
create or replace function public.pass_project(p_project uuid, p_code jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Masuk dulu' using errcode = '42501';
  end if;
  if jsonb_typeof(p_code) is distinct from 'object' or octet_length(p_code::text) > 65536 then
    raise exception 'Kode tidak valid' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.projects pr
    join public.topics t on t.id = pr.topic_id and t.status = 'published'
    where pr.id = p_project and pr.status = 'published'
  ) then
    raise exception 'Proyek tidak ditemukan' using errcode = 'P0002';
  end if;
  insert into public.project_progress (user_id, project_id, code) values (uid, p_project, p_code)
  on conflict (user_id, project_id) do update set code = excluded.code, passed_at = now();
end;
$$;

-- Where the caller stands on a topic's certificate.
create or replace function public.certificate_status(p_topic uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  total int;
  done int;
  exam_ok boolean;
  proj uuid;
  proj_ok boolean;
  cert text;
begin
  select count(*) into total from public.chapters where topic_id = p_topic and status = 'published';
  select count(*) into done from public.chapter_progress cp
    join public.chapters c on c.id = cp.chapter_id and c.topic_id = p_topic and c.status = 'published'
    where cp.user_id = uid;
  select exists (
    select 1 from public.exam_attempts a join public.exams e on e.id = a.exam_id
    where e.topic_id = p_topic and a.user_id = uid and a.passed
  ) into exam_ok;
  select id into proj from public.projects where topic_id = p_topic and status = 'published';
  proj_ok := proj is null or exists (select 1 from public.project_progress where project_id = proj and user_id = uid);
  select code into cert from public.certificates where topic_id = p_topic and user_id = uid;
  return jsonb_build_object(
    'chapters_done', done,
    'chapters_total', total,
    'exam_passed', exam_ok,
    'project_required', proj is not null,
    'project_passed', proj is not null and proj_ok,
    'eligible', uid is not null and done >= total and exam_ok and proj_ok,
    'code', cert
  );
end;
$$;

-- Issues (or returns) the caller's certificate for a topic.
create or replace function public.issue_certificate(p_topic uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  existing text;
  nm text;
  new_code text;
begin
  if uid is null then
    raise exception 'Masuk dulu' using errcode = '42501';
  end if;
  select code into existing from public.certificates where topic_id = p_topic and user_id = uid;
  if existing is not null then
    return existing;
  end if;
  select nullif(btrim(display_name), '') into nm from public.profiles where user_id = uid;
  if nm is null then
    raise exception 'Isi nama tampilan di Profil dulu' using errcode = 'P0001';
  end if;
  if not (public.certificate_status(p_topic) ->> 'eligible')::boolean then
    raise exception 'Belum memenuhi syarat sertifikat' using errcode = 'P0001';
  end if;
  new_code := upper(substr(md5(gen_random_uuid()::text), 1, 5) || '-' || substr(md5(gen_random_uuid()::text), 1, 5));
  insert into public.certificates (code, user_id, topic_id, name) values (new_code, uid, p_topic, nm)
  on conflict (user_id, topic_id) do nothing;
  select code into existing from public.certificates where topic_id = p_topic and user_id = uid;
  return existing;
end;
$$;

-- The public certificate page: only what the page shows.
create or replace function public.certificate_by_code(p_code text)
returns table (code text, name text, topic_title text, topic_slug text, issued_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select c.code, c.name, t.title, t.slug, c.issued_at
  from public.certificates c join public.topics t on t.id = c.topic_id
  where c.code = upper(btrim(p_code));
$$;

revoke execute on function public.pass_project(uuid, jsonb), public.certificate_status(uuid),
  public.issue_certificate(uuid), public.certificate_by_code(text) from public;
grant execute on function public.pass_project(uuid, jsonb), public.certificate_status(uuid),
  public.issue_certificate(uuid) to authenticated;
grant execute on function public.certificate_by_code(text) to anon, authenticated;

-- publish_topic from 20261011010000, plus the project swap and check.
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

  if exists (select 1 from public.chapters where topic_id = t.id and status = 'draft') then
    delete from public.chapters where topic_id = t.id and status = 'published';
    update public.chapters set status = 'published' where topic_id = t.id and status = 'draft';
  end if;

  -- A project reaches learners only after its solution passed its checks.
  if exists (select 1 from public.projects where topic_id = t.id and status = 'draft') then
    delete from public.projects where topic_id = t.id and status = 'published';
    update public.projects set status = 'published' where topic_id = t.id and status = 'draft';
  end if;
  if exists (select 1 from public.projects where topic_id = t.id and status = 'published' and verified_at is null) then
    raise exception 'Proyek akhir belum lolos uji solusi' using errcode = 'P0001';
  end if;

  select * into e from public.exams where topic_id = t.id;
  if found then
    if exists (select 1 from public.exam_questions where exam_id = e.id and status = 'draft') then
      delete from public.exam_questions where exam_id = e.id and status = 'published';
      update public.exam_questions set status = 'published' where exam_id = e.id and status = 'draft';
    end if;

    if exists (
      select 1 from public.exam_questions q
      join public.practice_questions p on p.topic_id = t.id
        and lower(btrim(p.prompt)) = lower(btrim(q.prompt))
      where q.exam_id = e.id and q.status = 'published'
    ) then
      raise exception 'Ada soal ujian yang sama dengan soal latihan' using errcode = 'P0001';
    end if;

    select count(*) into bank from public.exam_questions where exam_id = e.id and status = 'published';
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
