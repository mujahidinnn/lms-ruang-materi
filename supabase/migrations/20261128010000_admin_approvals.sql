-- Admin changes wait here until the approver (one account) says yes. The app
-- queues them in requireAdmin (lib/dal.ts) and replays them on approval.
create or replace function public.is_approver()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'mujahidin28394@gmail.com';
$$;

create table public.admin_approvals (
  id bigint generated always as identity primary key,
  action text not null check (char_length(action) between 1 and 60),
  args jsonb not null default '[]',
  requested_by uuid references auth.users (id) on delete set null,
  requested_email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'failed')),
  note text not null default '' check (char_length(note) <= 300),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index on public.admin_approvals (status, created_at desc);

alter table public.admin_approvals enable row level security;

create policy "admin_approvals: insert own" on public.admin_approvals
  for insert to authenticated
  with check ((select public.is_admin()) and requested_by = (select auth.uid()) and status = 'pending');

create policy "admin_approvals: read admin" on public.admin_approvals
  for select to authenticated
  using ((select public.is_admin()));

create policy "admin_approvals: decide approver" on public.admin_approvals
  for update to authenticated
  using ((select public.is_approver()))
  with check ((select public.is_approver()));
