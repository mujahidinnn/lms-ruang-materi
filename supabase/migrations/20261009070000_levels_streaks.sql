-- Level, streak and lencana are derived from what learners did, never
-- written by the client.

-- One row per learner per day with any learning activity, dated in their
-- timezone at the time it happened, so a later timezone change does not
-- rewrite the past.
create table public.learning_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  primary key (user_id, day)
);

alter table public.learning_days enable row level security;
create policy "learning_days: read own or admin" on public.learning_days
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create or replace function public.log_learning_day()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.learning_days (user_id, day)
  values (new.user_id, (now() at time zone coalesce(
    (select timezone from public.profiles where user_id = new.user_id), 'Asia/Jakarta'))::date)
  on conflict do nothing;
  return new;
end;
$$;

create trigger log_learning_day after insert on public.practice_sessions
  for each row execute function public.log_learning_day();
create trigger log_learning_day after insert or update on public.flashcard_reviews
  for each row execute function public.log_learning_day();
create trigger log_learning_day after update of submitted_at on public.exam_attempts
  for each row when (new.submitted_at is not null) execute function public.log_learning_day();

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  granted_at timestamptz not null default now(),
  unique (user_id, track_id)
);

alter table public.badges enable row level security;
create policy "badges: read own or admin" on public.badges
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- A core topic counts as passed when its exam has a passed attempt.
-- (track_levels repeats this inline, read through the caller's own RLS.)
create or replace function public.topic_passed(p_user uuid, p_topic uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.exam_attempts a join public.exams e on e.id = a.exam_id
    where e.topic_id = p_topic and a.user_id = p_user and a.passed
  )
$$;

-- Lencana: when a pass completes every core node of a published track.
-- Runs from submit_exam_attempt's update, the only writer of passed.
create or replace function public.grant_badges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.badges (user_id, track_id)
  select new.user_id, n.track_id
  from public.track_nodes n join public.exams e on e.topic_id = n.topic_id
  where e.id = new.exam_id and n.status = 'published' and public.track_is_published(n.track_id)
    and not exists (
      select 1 from public.track_nodes c
      where c.track_id = n.track_id and not c.optional and c.status = 'published'
        and not public.topic_passed(new.user_id, c.topic_id)
    )
  on conflict do nothing;
  return new;
end;
$$;

create trigger grant_badges after update of passed on public.exam_attempts
  for each row when (new.passed and old.passed is distinct from true)
  execute function public.grant_badges();

-- Per track, how many core topics the caller has passed by exam. The level
-- name comes from these counts (lib/level.ts), so it moves only on a pass.
create view public.track_levels with (security_invoker = true) as
select t.id as track_id, t.slug,
  count(*) filter (where not n.optional)::int as core_total,
  count(*) filter (where not n.optional and exists (
    select 1 from public.exam_attempts a join public.exams e on e.id = a.exam_id
    where e.topic_id = n.topic_id and a.user_id = (select auth.uid()) and a.passed
  ))::int as core_passed
from public.tracks t join public.track_nodes n on n.track_id = t.id
group by t.id, t.slug;

-- Current and best run of consecutive learning days. The current run counts
-- while its last day is today or yesterday in the learner's timezone.
create view public.learning_streaks with (security_invoker = true) as
with d as (
  select user_id, day, day - (row_number() over (partition by user_id order by day))::int as run
  from public.learning_days
),
runs as (
  select user_id, count(*)::int as days, max(day) as last_day from d group by user_id, run
)
select r.user_id,
  coalesce(max(r.days) filter (where r.last_day >= (now() at time zone p.timezone)::date - 1), 0) as current_days,
  max(r.days) as best_days
from runs r join public.profiles p on p.user_id = r.user_id
group by r.user_id;

grant select on public.track_levels, public.learning_streaks to authenticated;

-- Hapus akun: deletes the caller's auth user; every learner table cascades
-- and authored content keeps its rows (updated_by is set null). Learners
-- cannot upload to Storage, so they own no objects there. Admins are
-- removed from the dashboard instead, so content never loses its last admin
-- by accident.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Masuk dulu' using errcode = '42501';
  end if;
  if public.is_admin() then
    raise exception 'Akun admin dihapus lewat dashboard Supabase' using errcode = 'P0001';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
-- Internal to grant_badges: it takes any user id, so no client may call it.
revoke execute on function public.topic_passed(uuid, uuid) from public, anon, authenticated;
