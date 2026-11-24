-- Studio Proyek, first project. Gated: only accounts listed in feature_access
-- can use it; everyone else keeps seeing the "Segera" page. Release later by
-- dropping the has_feature() checks (or granting every account the feature).

create table public.feature_access (
  user_id uuid not null references auth.users (id) on delete cascade,
  feature text not null check (feature ~ '^[a-z-]{3,40}$'),
  granted_at timestamptz not null default now(),
  primary key (user_id, feature)
);
alter table public.feature_access enable row level security;
create policy "feature_access: read own" on public.feature_access
  for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.feature_access from anon, authenticated;
grant select on public.feature_access to authenticated;

create function public.has_feature(p_feature text) returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.feature_access where user_id = (select auth.uid()) and feature = p_feature) $$;
revoke execute on function public.has_feature(text) from public, anon;
grant execute on function public.has_feature(text) to authenticated;

-- Checklist progress: one row per ticked item.
create table public.studio_checks (
  user_id uuid not null references auth.users (id) on delete cascade,
  project text not null check (project ~ '^[a-z-]{3,40}$'),
  item text not null check (item ~ '^[a-z0-9-]{3,60}$'),
  done_at timestamptz not null default now(),
  primary key (user_id, project, item)
);
alter table public.studio_checks enable row level security;
create policy "studio_checks: read own" on public.studio_checks for select to authenticated using (user_id = (select auth.uid()));
create policy "studio_checks: insert own" on public.studio_checks for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.has_feature('studio-proyek')));
create policy "studio_checks: delete own" on public.studio_checks for delete to authenticated using (user_id = (select auth.uid()));
revoke all on public.studio_checks from anon, authenticated;
grant select, insert, delete on public.studio_checks to authenticated;

-- The finished project's live address, shown on the learner's public profile.
create table public.studio_projects (
  user_id uuid not null references auth.users (id) on delete cascade,
  project text not null check (project ~ '^[a-z-]{3,40}$'),
  url text not null check (char_length(url) <= 300 and url ~ '^https://[^[:space:]]+$'),
  hidden boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, project)
);
alter table public.studio_projects enable row level security;
create policy "studio_projects: read own or admin" on public.studio_projects for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "studio_projects: insert own" on public.studio_projects for insert to authenticated
  with check (user_id = (select auth.uid()) and not hidden and (select public.has_feature('studio-proyek')));
create policy "studio_projects: update own" on public.studio_projects for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "studio_projects: delete own" on public.studio_projects for delete to authenticated using (user_id = (select auth.uid()));
revoke all on public.studio_projects from anon, authenticated;
grant select on public.studio_projects to authenticated;
grant insert (user_id, project, url) on public.studio_projects to authenticated;
grant update (url, updated_at) on public.studio_projects to authenticated;
grant delete on public.studio_projects to authenticated;

-- Admins hide a link that should not show on a public profile.
create function public.admin_hide_studio_project(p_user uuid, p_project text, p_hidden boolean) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not (select public.is_admin()) then raise exception 'Hanya admin.' using errcode = '42501'; end if;
  update public.studio_projects set hidden = p_hidden where user_id = p_user and project = p_project;
end $$;
revoke execute on function public.admin_hide_studio_project(uuid, text, boolean) from public, anon;
grant execute on function public.admin_hide_studio_project(uuid, text, boolean) to authenticated;

-- Public profile now lists studio projects that are not hidden.
create or replace function public.public_profile(p_handle text)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'name', p.display_name,
    'certificates', coalesce((
      select jsonb_agg(jsonb_build_object('code', c.code, 'title', t.title, 'issued_at', c.issued_at) order by c.issued_at)
      from public.certificates c join public.topics t on t.id = c.topic_id where c.user_id = p.user_id
    ), '[]'),
    'badges', coalesce((
      select jsonb_agg(tr.title) from public.badges b join public.tracks tr on tr.id = b.track_id where b.user_id = p.user_id
    ), '[]'),
    'studio', coalesce((
      select jsonb_agg(jsonb_build_object('project', sp.project, 'url', sp.url) order by sp.updated_at)
      from public.studio_projects sp where sp.user_id = p.user_id and not sp.hidden
    ), '[]'),
    'chapters', (select count(*) from public.chapter_progress where user_id = p.user_id),
    'best_streak', coalesce((select best_days from public.learning_streaks where user_id = p.user_id), 0)
  )
  from public.profiles p
  where p.public_handle = p_handle and p.guardian_consent
    and coalesce(trim(p.display_name), '') <> ''
$$;
