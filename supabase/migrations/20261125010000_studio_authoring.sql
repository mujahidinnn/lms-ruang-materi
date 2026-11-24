-- Studio Proyek authored by admins: projects made of steps, each step with
-- full instructions (markdown), materials (code files, links) and self-check
-- items. Learners read published projects while early access is on.

create table public.studio_defs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  title text not null check (char_length(title) between 3 and 80),
  summary text not null default '' check (char_length(summary) <= 400),
  level text not null default 'pemula' check (level in ('pemula', 'menengah', 'lanjut')),
  est_hours smallint check (est_hours between 1 and 200),
  status text not null default 'draft' check (status in ('draft', 'published')),
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- stage: the eight stages shown on /studio-proyek. materials: [{id, kind:
-- 'kode'|'tautan', name, lang?, content?, url?}]. checks: [{id, text}]; the
-- ids are what learners' ticks (studio_checks.item) point to.
create table public.studio_steps (
  id uuid primary key default gen_random_uuid(),
  def_id uuid not null references public.studio_defs (id) on delete cascade,
  stage text not null check (stage in ('brief', 'brainstorming', 'teknologi', 'merancang', 'ngoding', 'uji', 'deploy', 'dokumentasi')),
  position int not null default 0,
  slug text not null check (slug ~ '^[a-z0-9-]{3,60}$'),
  title text not null check (char_length(title) between 3 and 120),
  body text not null default '' check (char_length(body) <= 20000),
  est_minutes smallint check (est_minutes between 1 and 600),
  materials jsonb not null default '[]' check (jsonb_typeof(materials) = 'array' and jsonb_array_length(materials) <= 20),
  checks jsonb not null default '[]' check (jsonb_typeof(checks) = 'array' and jsonb_array_length(checks) <= 20),
  unique (def_id, slug)
);
create index on public.studio_steps (def_id, position);

-- Early access can be switched on for everyone with one row here.
create table public.feature_open (
  feature text primary key check (feature ~ '^[a-z-]{3,40}$')
);
alter table public.feature_open enable row level security;
create policy "feature_open: read" on public.feature_open for select to authenticated using (true);
revoke all on public.feature_open from anon, authenticated;
grant select on public.feature_open to authenticated;

create or replace function public.has_feature(p_feature text) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.feature_open where feature = p_feature)
      or exists (select 1 from public.feature_access where user_id = (select auth.uid()) and feature = p_feature)
$$;

-- Content policies: admins everything; learners only published projects, and
-- only while they have the feature.
alter table public.studio_defs enable row level security;
alter table public.studio_steps enable row level security;
create policy "studio_defs: read" on public.studio_defs for select to authenticated
  using ((select public.is_admin()) or (status = 'published' and (select public.has_feature('studio-proyek'))));
create policy "studio_defs: admin write" on public.studio_defs for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "studio_steps: read" on public.studio_steps for select to authenticated
  using ((select public.is_admin()) or (
    (select public.has_feature('studio-proyek'))
    and exists (select 1 from public.studio_defs d where d.id = def_id and d.status = 'published')
  ));
create policy "studio_steps: admin write" on public.studio_steps for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
revoke all on public.studio_defs, public.studio_steps from anon, authenticated;
grant select, insert, update, delete on public.studio_defs, public.studio_steps to authenticated;

-- Admin access management. feature_access is read-only for learners; admins
-- manage it through these functions and may read all rows.
create policy "feature_access: read admin" on public.feature_access for select to authenticated
  using ((select public.is_admin()));

create function public.admin_grant_feature(p_user uuid, p_feature text) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not (select public.is_admin()) then raise exception 'Hanya admin.' using errcode = '42501'; end if;
  insert into public.feature_access (user_id, feature) values (p_user, p_feature) on conflict do nothing;
end $$;

create function public.admin_revoke_feature(p_user uuid, p_feature text) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not (select public.is_admin()) then raise exception 'Hanya admin.' using errcode = '42501'; end if;
  delete from public.feature_access where user_id = p_user and feature = p_feature;
end $$;

create function public.admin_set_feature_open(p_feature text, p_open boolean) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not (select public.is_admin()) then raise exception 'Hanya admin.' using errcode = '42501'; end if;
  if p_open then insert into public.feature_open (feature) values (p_feature) on conflict do nothing;
  else delete from public.feature_open where feature = p_feature; end if;
end $$;

revoke execute on function public.admin_grant_feature(uuid, text), public.admin_revoke_feature(uuid, text), public.admin_set_feature_open(text, boolean) from public, anon;
grant execute on function public.admin_grant_feature(uuid, text), public.admin_revoke_feature(uuid, text), public.admin_set_feature_open(text, boolean) to authenticated;
