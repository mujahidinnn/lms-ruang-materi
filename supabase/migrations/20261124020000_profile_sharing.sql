-- Weekly goal, weekly leaderboard and public profile. Anything that shows a
-- name to others is opt-in and only for adult accounts (UU PDP).
alter table public.profiles
  add column weekly_goal smallint check (weekly_goal between 1 and 14),
  add column leaderboard_opt_in boolean not null default false,
  add column public_handle text unique check (public_handle ~ '^[a-z0-9-]{3,30}$');

grant update (weekly_goal, leaderboard_opt_in, public_handle) on public.profiles to authenticated;

-- Start of the current week (Monday 00:00, Jakarta).
create function public.week_start() returns timestamptz
language sql stable set search_path = ''
as $$ select date_trunc('week', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta' $$;

-- Chapters the caller finished this week.
create function public.my_week_chapters() returns int
language sql stable security definer set search_path = ''
as $$
  select count(*)::int from public.chapter_progress
  where user_id = (select auth.uid()) and completed_at >= public.week_start()
$$;

-- Top 10 this week among learners who opted in, plus the caller's own row.
create function public.weekly_leaderboard()
returns table (rank int, name text, chapters int, me boolean)
language sql stable security definer set search_path = ''
as $$
  with counts as (
    select p.user_id, p.display_name, count(*)::int as n
    from public.chapter_progress c
    join public.profiles p on p.user_id = c.user_id
    where c.completed_at >= public.week_start()
      and p.leaderboard_opt_in and p.guardian_consent and p.age_group = 'dewasa'
      and coalesce(trim(p.display_name), '') <> ''
    group by p.user_id, p.display_name
  ), ranked as (
    select user_id, display_name, n, (row_number() over (order by n desc, display_name))::int as r from counts
  )
  select r, display_name, n, user_id = (select auth.uid())
  from ranked where r <= 10 or user_id = (select auth.uid())
  order by r
$$;

-- What a public profile page shows. Null when the handle is unknown or the
-- owner is not an adult who agreed.
create function public.public_profile(p_handle text)
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
    'chapters', (select count(*) from public.chapter_progress where user_id = p.user_id),
    'best_streak', coalesce((select best_days from public.learning_streaks where user_id = p.user_id), 0)
  )
  from public.profiles p
  where p.public_handle = p_handle and p.guardian_consent and p.age_group = 'dewasa'
    and coalesce(trim(p.display_name), '') <> ''
$$;

revoke execute on function public.my_week_chapters(), public.weekly_leaderboard() from public, anon;
grant execute on function public.my_week_chapters(), public.weekly_leaderboard() to authenticated;
revoke execute on function public.public_profile(text) from public;
grant execute on function public.public_profile(text) to anon, authenticated;
