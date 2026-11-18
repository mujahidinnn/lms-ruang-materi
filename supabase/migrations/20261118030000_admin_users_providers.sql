-- admin_users.provider now lists every sign-in method ("email,google"),
-- not only the one used at sign-up.
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
         coalesce(
           (select string_agg(i.provider, ',' order by i.created_at) from auth.identities i where i.user_id = u.id),
           'email'
         ),
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
