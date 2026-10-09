-- Profiles: one row per auth user. Role is never taken from the client.

create or replace function public.is_valid_timezone(tz text)
returns boolean
language sql
stable
as $$
  select exists (select 1 from pg_timezone_names where name = tz)
$$;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  role text not null default 'student' check (role in ('student', 'admin')),
  timezone text not null default 'Asia/Jakarta' check (public.is_valid_timezone(timezone)),
  guardian_consent boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- security definer so policies can check the role without recursing into
-- profiles' own RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where user_id = (select auth.uid()) and role = 'admin'
  )
$$;

create policy "profiles: read own or admin"
  on public.profiles for select
  to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Learners may change only these columns. Role changes need the service role.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, timezone, guardian_consent) on public.profiles to authenticated;

-- Always 'student', raw_user_meta_data is ignored on purpose.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
