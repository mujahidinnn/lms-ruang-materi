-- Other admins may read everything but change nothing directly: their
-- changes go through admin_approvals (lib/dal.ts requireAdmin). Writes need
-- can_edit(): the approver, or the dev admin the content scripts sign in as.
create or replace function public.is_approver()
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.is_admin() and coalesce(auth.jwt() ->> 'email', '') = 'mujahidin28394@gmail.com';
$$;

create or replace function public.can_edit()
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.is_admin() and coalesce(auth.jwt() ->> 'email', '') in ('mujahidin28394@gmail.com', 'dev-admin@ruangmateri.local');
$$;

do $$
declare
  p record;
  f record;
begin
  -- Write policies on content: is_admin() becomes can_edit(). A FOR ALL
  -- policy also covered reads, so admins keep a read policy of their own.
  for p in
    select tablename, policyname, cmd, qual, with_check from pg_policies
    where schemaname = 'public'
      and cmd <> 'SELECT'
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%is_admin()%'
      and tablename not in ('admin_approvals', 'admin_audit_log')
  loop
    if p.cmd = 'ALL' then
      execute format('create policy %I on public.%I for select to authenticated using (%s)', p.policyname || ' (read)', p.tablename, p.qual);
    end if;
    execute format('alter policy %I on public.%I', p.policyname, p.tablename)
      || coalesce(' using (' || replace(p.qual, 'is_admin()', 'public.can_edit()') || ')', '')
      || coalesce(' with check (' || replace(p.with_check, 'is_admin()', 'public.can_edit()') || ')', '');
  end loop;

  -- Admin functions that change data check can_edit() instead.
  for f in
    select fn.oid from pg_proc fn join pg_namespace n on n.oid = fn.pronamespace
    where n.nspname = 'public'
      and fn.proname in ('admin_delete_user', 'admin_grant_feature', 'admin_hide_studio_project', 'admin_revoke_feature',
                        'admin_set_feature_open', 'publish_topic', 'publish_track', 'rename_topic', 'set_user_role')
  loop
    execute replace(pg_get_functiondef(f.oid), 'public.is_admin()', 'public.can_edit()');
  end loop;
end $$;
