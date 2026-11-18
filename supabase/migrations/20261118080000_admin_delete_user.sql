-- Admin deletes an account. auth.users rows cascade to profiles and progress.
-- An admin cannot delete their own account.
create or replace function public.admin_delete_user(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if target = (select auth.uid()) then
    raise exception 'Kamu tidak bisa menghapus akunmu sendiri.' using errcode = 'P0001';
  end if;
  delete from auth.users where id = target;
  if not found then
    raise exception 'Pengguna tidak ditemukan.' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;
