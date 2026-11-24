-- A learner could delete a row an admin had hidden and save the address again,
-- which resets `hidden`. Hidden rows can no longer be deleted by their owner;
-- an update (new address) keeps the flag, so only an admin can show it again.
drop policy "studio_projects: delete own" on public.studio_projects;
create policy "studio_projects: delete own, not hidden" on public.studio_projects
  for delete to authenticated using (user_id = (select auth.uid()) and not hidden);
