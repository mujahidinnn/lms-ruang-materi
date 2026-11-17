-- Admin Pengguna also shows how each account signs in (email or google).
drop function public.admin_users();

create function public.admin_users()
returns table (
  user_id uuid,
  email text,
  display_name text,
  role text,
  provider text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  confirmed boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.email::text, p.display_name, coalesce(p.role, 'student'),
         coalesce(u.raw_app_meta_data ->> 'provider', 'email'),
         u.created_at, u.last_sign_in_at, u.email_confirmed_at is not null
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  where (select public.is_admin())
  order by u.created_at desc
$$;

revoke execute on function public.admin_users() from public, anon;
grant execute on function public.admin_users() to authenticated;
