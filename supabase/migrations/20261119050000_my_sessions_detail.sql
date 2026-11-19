-- Device list detail: sign-in time and IP next to the user agent.
drop function public.my_sessions();
create function public.my_sessions()
returns table (id uuid, user_agent text, ip text, created_at timestamptz, refreshed_at timestamptz, current boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.user_agent, host(s.ip), s.created_at, coalesce(s.refreshed_at, s.updated_at, s.created_at),
    s.id::text = (select auth.jwt() ->> 'session_id')
  from auth.sessions s
  where s.user_id = (select auth.uid()) and (s.not_after is null or s.not_after > now())
  order by 5 desc;
$$;

revoke all on function public.my_sessions() from public, anon;
grant execute on function public.my_sessions() to authenticated;
