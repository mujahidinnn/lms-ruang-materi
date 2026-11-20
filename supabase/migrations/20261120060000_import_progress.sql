-- Percent done, written by the worker while a job runs.
alter table public.import_jobs add column progress smallint not null default 0 check (progress between 0 and 100);
