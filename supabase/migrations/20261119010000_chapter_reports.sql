-- Learner reports on a chapter (typo, wrong content, unclear). Learners add
-- their own; admins read and close them. One open report per learner per chapter.
create table public.chapter_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  kind text not null check (kind in ('salah', 'tidak-jelas', 'lainnya')),
  note text not null check (char_length(note) between 1 and 500),
  status text not null default 'baru' check (status in ('baru', 'selesai')),
  created_at timestamptz not null default now()
);

create unique index on public.chapter_reports (user_id, chapter_id) where status = 'baru';
create index on public.chapter_reports (status, created_at desc);
create index on public.chapter_reports (chapter_id);

alter table public.chapter_reports enable row level security;

create policy "chapter_reports: insert own" on public.chapter_reports
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'baru');

create policy "chapter_reports: read admin" on public.chapter_reports
  for select to authenticated
  using ((select public.is_admin()));

create policy "chapter_reports: update admin" on public.chapter_reports
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- The learner list of names goes through admin_users(); nothing else is exposed.
