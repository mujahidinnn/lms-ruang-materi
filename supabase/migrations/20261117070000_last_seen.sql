-- Last time a signed-in learner opened a page, for the admin Pengguna list.
-- Written at most every 2 minutes per user (the app also sets a 5 minute
-- cookie so most requests never reach this function).
alter table public.profiles add column last_seen_at timestamptz;

create function public.touch_seen()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles set last_seen_at = now()
  where user_id = (select auth.uid())
    and (last_seen_at is null or last_seen_at < now() - interval '2 minutes')
$$;
revoke execute on function public.touch_seen() from public, anon;
grant execute on function public.touch_seen() to authenticated;

-- last_active_at now includes the last page view.
create or replace function public.admin_users()
returns table (
  user_id uuid, email text, display_name text, role text, provider text, avatar_url text,
  created_at timestamptz, last_sign_in_at timestamptz, last_active_at timestamptz, confirmed boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.email::text, p.display_name, coalesce(p.role, 'student'),
         coalesce(u.raw_app_meta_data ->> 'provider', 'email'),
         coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture'),
         u.created_at, u.last_sign_in_at,
         greatest(
           u.last_sign_in_at,
           p.last_seen_at,
           (select max(g.updated_at) from public.progress g where g.user_id = u.id),
           (select max(c.completed_at) from public.chapter_progress c where c.user_id = u.id)
         ),
         u.email_confirmed_at is not null
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  where (select public.is_admin())
  order by u.created_at desc
$$;
