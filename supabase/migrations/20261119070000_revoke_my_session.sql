-- Profil: keluarkan satu perangkat. Only the caller's own sessions, and never
-- the one behind this request (that is plain "Keluar").
create function public.revoke_my_session(p_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.sessions
  where id = p_id and user_id = (select auth.uid()) and id::text <> (select auth.jwt() ->> 'session_id');
$$;

revoke all on function public.revoke_my_session(uuid) from public, anon;
grant execute on function public.revoke_my_session(uuid) to authenticated;
