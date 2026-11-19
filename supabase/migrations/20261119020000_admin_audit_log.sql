-- Who did what in /admin. Append only: admins insert their own rows and read
-- all of them; nobody updates or deletes. The email is copied so the row
-- still reads right after an account is deleted.
create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid references auth.users (id) on delete set null,
  admin_email text not null,
  action text not null check (char_length(action) between 1 and 60),
  detail text not null default '' check (char_length(detail) <= 300),
  created_at timestamptz not null default now()
);

create index on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;

create policy "admin_audit_log: insert own" on public.admin_audit_log
  for insert to authenticated
  with check ((select public.is_admin()) and admin_id = (select auth.uid()));

create policy "admin_audit_log: read admin" on public.admin_audit_log
  for select to authenticated
  using ((select public.is_admin()));
