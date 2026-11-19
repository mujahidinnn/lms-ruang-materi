-- Country of each sign-in, from Vercel's edge header at login time. Rows go
-- with the session when it ends.
create table public.session_geo (
  session_id uuid primary key references auth.sessions (id) on delete cascade,
  country text not null check (country ~ '^[A-Z]{2}$')
);
alter table public.session_geo enable row level security;

create function public.record_session_country(p_country text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.session_geo (session_id, country)
  select s.id, upper(p_country) from auth.sessions s
  where s.id::text = (select auth.jwt() ->> 'session_id') and s.user_id = (select auth.uid())
  on conflict do nothing;
$$;
revoke all on function public.record_session_country(text) from public, anon;
grant execute on function public.record_session_country(text) to authenticated;

drop function public.my_sessions();
create function public.my_sessions()
returns table (id uuid, user_agent text, ip text, country text, created_at timestamptz, refreshed_at timestamptz, current boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.user_agent, host(s.ip), g.country, s.created_at, coalesce(s.refreshed_at, s.updated_at, s.created_at),
    s.id::text = (select auth.jwt() ->> 'session_id')
  from auth.sessions s
  left join public.session_geo g on g.session_id = s.id
  where s.user_id = (select auth.uid()) and (s.not_after is null or s.not_after > now())
  order by 6 desc;
$$;
revoke all on function public.my_sessions() from public, anon;
grant execute on function public.my_sessions() to authenticated;
