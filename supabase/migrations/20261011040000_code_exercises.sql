-- Code exercises inside chapters (spec 2026-10-11-code-practice). Learner
-- code runs in the browser sandbox; the database only stores exercises
-- and who passed which.

create type public.code_kind as enum ('web', 'js', 'express', 'sql', 'git');

create table public.code_exercises (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  position int not null default 0,
  kind public.code_kind not null,
  title text not null check (char_length(title) between 1 and 120),
  prompt text not null,
  starter jsonb not null default '{}',
  solution jsonb not null default '{}',
  setup text not null default '',
  tests jsonb not null default '[]' check (jsonb_typeof(tests) = 'array'),
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.code_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.code_exercises (id) on delete cascade,
  passed_at timestamptz not null default now(),
  code jsonb not null default '{}',
  primary key (user_id, exercise_id)
);

create index on public.code_exercises (chapter_id);
create index on public.code_exercises (updated_by) where updated_by is not null;
create index on public.code_progress (exercise_id);

alter table public.code_exercises enable row level security;
alter table public.code_progress enable row level security;

create trigger set_updated_by before insert or update on public.code_exercises
  for each row execute function public.set_updated_by();

create policy "code_exercises: admin all" on public.code_exercises for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "code_exercises: read published" on public.code_exercises for select to anon, authenticated
  using (chapter_id in (
    select c.id from public.chapters c join public.topics t on t.id = c.topic_id
    where c.status = 'published' and t.status = 'published'));
create policy "code_progress: read own or admin" on public.code_progress for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- No learner write policy: only pass_code_exercise() writes code_progress.
create trigger require_consent before insert on public.code_progress
  for each row execute function public.require_consent();
create trigger log_learning_day after insert or update of passed_at on public.code_progress
  for each row execute function public.log_learning_day();

-- Records a pass. Checks run in the browser and are public, like practice
-- keys: the row means "ran and passed", not proof.
create or replace function public.pass_code_exercise(p_exercise uuid, p_code jsonb)
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
  if not exists (
    select 1 from public.code_exercises e
    join public.chapters c on c.id = e.chapter_id and c.status = 'published'
    join public.topics t on t.id = c.topic_id and t.status = 'published'
    where e.id = p_exercise
  ) then
    raise exception 'Latihan tidak ditemukan' using errcode = 'P0002';
  end if;
  insert into public.code_progress (user_id, exercise_id, code) values (uid, p_exercise, coalesce(p_code, '{}'))
  on conflict (user_id, exercise_id) do update set code = excluded.code, passed_at = now();
end;
$$;

revoke execute on function public.pass_code_exercise(uuid, jsonb) from public, anon;
grant execute on function public.pass_code_exercise(uuid, jsonb) to authenticated;

-- A chapter with exercises completes only once every one has passed.
create or replace function public.complete_chapter(p_chapter uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.open_chapter(p_chapter);
  if exists (
    select 1 from public.code_exercises e
    where e.chapter_id = p_chapter
      and not exists (select 1 from public.code_progress p where p.exercise_id = e.id and p.user_id = auth.uid())
  ) then
    raise exception 'Selesaikan latihan kode di bab ini dulu' using errcode = 'P0001';
  end if;
  insert into public.chapter_progress (user_id, chapter_id)
  values (auth.uid(), p_chapter)
  on conflict do nothing;
end;
$$;
