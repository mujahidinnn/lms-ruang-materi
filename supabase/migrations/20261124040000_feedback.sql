-- Global feedback and suggestions from signed-in learners: not tied to a
-- chapter or exam question (those are chapter_reports). At most 5 a day each.
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null check (category in ('saran', 'bug', 'konten', 'tampilan', 'lainnya')),
  message text not null check (char_length(message) between 10 and 1000),
  -- Where the learner was, a path on this site.
  page text check (page is null or (char_length(page) <= 200 and page ~ '^/[^[:space:]]*$')),
  status text not null default 'baru' check (status in ('baru', 'selesai')),
  created_at timestamptz not null default now()
);

create index on public.feedback (status, created_at desc);
create index on public.feedback (user_id, created_at desc);

alter table public.feedback enable row level security;

create policy "feedback: insert own, 5 a day" on public.feedback
  for insert to authenticated
  with check (
    user_id = (select auth.uid()) and status = 'baru'
    and (select count(*) from public.feedback f where f.user_id = (select auth.uid()) and f.created_at > now() - interval '1 day') < 5
  );
create policy "feedback: read own or admin" on public.feedback
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "feedback: update admin" on public.feedback
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

revoke all on public.feedback from anon, authenticated;
grant select, insert, update on public.feedback to authenticated;
