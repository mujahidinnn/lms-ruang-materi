-- Announcements: shown as a banner on the learner dashboard and/or sent by
-- email. Admins write them; learners read the web ones through RLS.

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 2000),
  link_url text check (link_url is null or link_url ~ '^(https://|/[^/])'),
  audience text not null default 'all' check (audience in ('all', 'student', 'admin')),
  on_web boolean not null default true,
  on_email boolean not null default false,
  email_sent int not null default 0,
  email_failed int not null default 0,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

create policy "announcements: read"
  on public.announcements for select to authenticated
  using ((select public.is_admin()) or (on_web and audience in ('all', 'student')));
create policy "announcements: admin insert"
  on public.announcements for insert to authenticated
  with check ((select public.is_admin()));
create policy "announcements: admin update"
  on public.announcements for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "announcements: admin delete"
  on public.announcements for delete to authenticated
  using ((select public.is_admin()));

revoke all on public.announcements from anon, authenticated;
grant select, insert, update, delete on public.announcements to authenticated;

-- A learner can turn announcement emails off in /profil.
alter table public.profiles add column announce_email boolean not null default true;
grant update (announce_email) on public.profiles to authenticated;

-- Addresses an announcement email goes to: confirmed accounts that did not
-- opt out, filtered by role. Admin only.
create function public.announce_recipients(p_audience text)
returns table (email text)
language sql
stable
security definer
set search_path = ''
as $$
  select u.email::text
  from auth.users u
  join public.profiles p on p.user_id = u.id
  where (select public.is_admin())
    and u.email is not null
    and u.email_confirmed_at is not null
    and p.announce_email
    and (p_audience = 'all' or (p_audience = 'student' and p.role = 'student') or (p_audience = 'admin' and p.role = 'admin'))
$$;

revoke execute on function public.announce_recipients(text) from public, anon;
grant execute on function public.announce_recipients(text) to authenticated;
