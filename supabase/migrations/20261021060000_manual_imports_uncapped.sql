-- The daily cap guards AI cost. A hand-written class (provider claude,
-- model manual) only renders slides and loads a checked draft, so it neither
-- counts toward nor is stopped by the cap. One import at a time still holds.
create or replace function public.check_import_limits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  max_per_day constant int := 10;
begin
  perform pg_advisory_xact_lock(hashtext('import_jobs'));

  if exists (
    select 1 from public.import_jobs
    where status in ('queued', 'rendering', 'drafting')
      and updated_at > now() - interval '30 minutes'
  ) then
    raise exception 'Masih ada impor yang berjalan' using errcode = 'P0001';
  end if;

  if not (new.provider = 'claude' and new.model = 'manual')
    and (
      select count(*) from public.import_jobs
      where created_at > now() - interval '1 day'
        and not (provider = 'claude' and model = 'manual')
    ) >= max_per_day then
    raise exception 'Batas % impor per hari tercapai', max_per_day using errcode = 'P0001';
  end if;

  return new;
end;
$$;
