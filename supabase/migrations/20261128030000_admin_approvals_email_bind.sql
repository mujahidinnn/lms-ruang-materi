-- The requester's email must be their own, so the approval list never shows
-- a forged name.
alter policy "admin_approvals: insert own" on public.admin_approvals
  with check (
    (select public.is_admin())
    and requested_by = (select auth.uid())
    and requested_email = coalesce((select auth.jwt() ->> 'email'), '')
    and status = 'pending'
  );
