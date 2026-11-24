-- The upsert from the browser also sends updated_at on insert.
grant insert (updated_at) on public.studio_projects to authenticated;
