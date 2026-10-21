-- A project's solution leads to a certificate, so unlike exercise solutions
-- (public, like practice keys) it is admin-only: its own table, RLS for
-- admins, written by the worker with the service role. One row per project.

alter table public.projects drop column solution;

create table public.project_solutions (
  project_id uuid primary key references public.projects (id) on delete cascade,
  solution jsonb not null default '{}',
  updated_by uuid references auth.users (id) on delete set null
);

create index on public.project_solutions (updated_by) where updated_by is not null;
alter table public.project_solutions enable row level security;
create trigger set_updated_by before insert or update on public.project_solutions
  for each row execute function public.set_updated_by();
create policy "project_solutions: admin all" on public.project_solutions for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
