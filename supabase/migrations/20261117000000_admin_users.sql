-- Admin page "Pengguna": list accounts with their role, and change a role.
-- profiles.role is not writable by the client, so both go through
-- security definer functions that check is_admin() themselves.

create or replace function public.admin_users()
returns table (
  user_id uuid,
  email text,
  display_name text,
  role text,
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
         u.created_at, u.last_sign_in_at, u.email_confirmed_at is not null
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  where (select public.is_admin())
  order by u.created_at desc
$$;

-- An admin cannot change their own role, so there is always one admin left.
create or replace function public.set_user_role(target uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if new_role not in ('student', 'admin') then
    raise exception 'Role tidak dikenal.' using errcode = 'P0001';
  end if;
  if target = (select auth.uid()) then
    raise exception 'Kamu tidak bisa mengubah rolemu sendiri.' using errcode = 'P0001';
  end if;
  update public.profiles set role = new_role where user_id = target;
  if not found then
    raise exception 'Pengguna tidak ditemukan.' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.admin_users(), public.set_user_role(uuid, text) from public, anon;
grant execute on function public.admin_users(), public.set_user_role(uuid, text) to authenticated;
