-- Leaderboard and public profile: every learner who opted in and has consent
-- on file (an adult, or a parent or guardian who allowed it). Name only.
create or replace function public.weekly_leaderboard()
returns table (rank int, name text, chapters int, me boolean)
language sql stable security definer set search_path = ''
as $$
  with counts as (
    select p.user_id, p.display_name, count(*)::int as n
    from public.chapter_progress c
    join public.profiles p on p.user_id = c.user_id
    where c.completed_at >= public.week_start()
      and p.leaderboard_opt_in and p.guardian_consent
      and coalesce(trim(p.display_name), '') <> ''
    group by p.user_id, p.display_name
  ), ranked as (
    select user_id, display_name, n, (row_number() over (order by n desc, display_name))::int as r from counts
  )
  select r, display_name, n, user_id = (select auth.uid())
  from ranked where r <= 10 or user_id = (select auth.uid())
  order by r
$$;

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
    'chapters', (select count(*) from public.chapter_progress where user_id = p.user_id),
    'best_streak', coalesce((select best_days from public.learning_streaks where user_id = p.user_id), 0)
  )
  from public.profiles p
  where p.public_handle = p_handle and p.guardian_consent
    and coalesce(trim(p.display_name), '') <> ''
$$;
