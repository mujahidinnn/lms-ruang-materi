-- The profile's device list: the caller's own live sessions (auth.sessions is
-- not exposed to the API). current marks the session behind this request's JWT.
create or replace function public.my_sessions()
returns table (id uuid, user_agent text, refreshed_at timestamptz, current boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.user_agent, coalesce(s.refreshed_at, s.updated_at, s.created_at),
    s.id::text = (select auth.jwt() ->> 'session_id')
  from auth.sessions s
  where s.user_id = (select auth.uid()) and (s.not_after is null or s.not_after > now())
  order by 3 desc;
$$;

revoke all on function public.my_sessions() from public, anon;
grant execute on function public.my_sessions() to authenticated;
