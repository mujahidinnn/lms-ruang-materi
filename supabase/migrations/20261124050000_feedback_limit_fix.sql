-- The "5 a day" rule read feedback from inside its own policy, which Postgres
-- rejects as infinite recursion (42P17). Count through a function instead.
create function public.my_feedback_today() returns int
language sql stable security definer set search_path = ''
as $$
  select count(*)::int from public.feedback
  where user_id = (select auth.uid()) and created_at > now() - interval '1 day'
$$;

revoke execute on function public.my_feedback_today() from public, anon;
grant execute on function public.my_feedback_today() to authenticated;

drop policy "feedback: insert own, 5 a day" on public.feedback;
create policy "feedback: insert own, 5 a day" on public.feedback
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'baru' and (select public.my_feedback_today()) < 5);
