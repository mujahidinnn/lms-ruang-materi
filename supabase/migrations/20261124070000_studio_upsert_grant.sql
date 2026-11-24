-- An upsert sets every column it sends on conflict, so the learner needs update
-- on the key columns too. Safe: the update policy checks user_id = auth.uid()
-- on the new row, so a row can never move to another account.
grant update (user_id, project) on public.studio_projects to authenticated;
