-- Admin dashboard data: last activity per user, class covers in the recap,
-- announcements to chosen users, and the overview numbers.

-- 1. last_active_at: sign-in or the latest study activity, whichever is newer.
drop function public.admin_users();
create function public.admin_users()
returns table (
  user_id uuid, email text, display_name text, role text, provider text, avatar_url text,
  created_at timestamptz, last_sign_in_at timestamptz, last_active_at timestamptz, confirmed boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.email::text, p.display_name, coalesce(p.role, 'student'),
         coalesce(u.raw_app_meta_data ->> 'provider', 'email'),
         coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture'),
         u.created_at, u.last_sign_in_at,
         greatest(
           u.last_sign_in_at,
           (select max(g.updated_at) from public.progress g where g.user_id = u.id),
           (select max(c.completed_at) from public.chapter_progress c where c.user_id = u.id)
         ),
         u.email_confirmed_at is not null
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  where (select public.is_admin())
  order by u.created_at desc
$$;
revoke execute on function public.admin_users() from public, anon;
grant execute on function public.admin_users() to authenticated;

-- 2. recap with the class cover path.
create or replace function public.admin_user_recap(target uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when not (select public.is_admin()) then null else jsonb_build_object(
    'days', (select count(*) from public.learning_days where user_id = target),
    'last_day', (select max(day) from public.learning_days where user_id = target),
    'practice_sessions', (select count(*) from public.practice_sessions where user_id = target),
    'practice_correct', (select coalesce(sum(correct), 0) from public.practice_sessions where user_id = target),
    'practice_total', (select coalesce(sum(total), 0) from public.practice_sessions where user_id = target),
    'flashcards', (select count(*) from public.flashcard_reviews where user_id = target),
    'topics', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.last_at desc nulls last)
      from (
        select tp.slug, tp.title,
          (select s.path from public.slides s where s.topic_id = tp.id order by s.index limit 1) as cover_path,
          (select pg.state::text from public.progress pg where pg.user_id = target and pg.topic_id = tp.id) as state,
          (select pg.last_slide from public.progress pg where pg.user_id = target and pg.topic_id = tp.id) as last_slide,
          (select count(*) from public.chapters c where c.topic_id = tp.id and c.status = 'published') as chapters_total,
          (select count(*) from public.chapter_progress cp join public.chapters c on c.id = cp.chapter_id
            where cp.user_id = target and c.topic_id = tp.id and c.status = 'published') as chapters_done,
          (select count(*) from public.code_exercises e join public.chapters c on c.id = e.chapter_id
            where c.topic_id = tp.id and c.status = 'published') as exercises_total,
          (select count(*) from public.code_progress p
            join public.code_exercises e on e.id = p.exercise_id join public.chapters c on c.id = e.chapter_id
            where p.user_id = target and c.topic_id = tp.id and c.status = 'published') as exercises_passed,
          (select max(a.score) from public.exam_attempts a join public.exams x on x.id = a.exam_id
            where a.user_id = target and x.topic_id = tp.id and a.submitted_at is not null) as exam_best,
          (select count(*) from public.exam_attempts a join public.exams x on x.id = a.exam_id
            where a.user_id = target and x.topic_id = tp.id and a.submitted_at is not null) as exam_tries,
          coalesce((select bool_or(a.passed) from public.exam_attempts a join public.exams x on x.id = a.exam_id
            where a.user_id = target and x.topic_id = tp.id), false) as exam_passed,
          exists (select 1 from public.project_progress pp join public.projects pr on pr.id = pp.project_id
            where pp.user_id = target and pr.topic_id = tp.id) as project_passed,
          exists (select 1 from public.certificates ce where ce.user_id = target and ce.topic_id = tp.id) as certificate,
          greatest(
            (select max(updated_at) from public.progress where user_id = target and topic_id = tp.id),
            (select max(cp.completed_at) from public.chapter_progress cp join public.chapters c on c.id = cp.chapter_id
              where cp.user_id = target and c.topic_id = tp.id)
          ) as last_at
        from public.topics tp
        where tp.status = 'published'
      ) t
      where t.chapters_done > 0 or t.exercises_passed > 0 or t.exam_tries > 0 or t.last_at is not null
    ), '[]'::jsonb)
  ) end
$$;

revoke execute on function public.admin_user_recap(uuid) from public, anon;
grant execute on function public.admin_user_recap(uuid) to authenticated;

-- 3. announcements to chosen users.
alter table public.announcements add column user_ids uuid[] not null default '{}';
alter table public.announcements drop constraint announcements_audience_check;
alter table public.announcements add constraint announcements_audience_check check (audience in ('all', 'student', 'admin', 'users'));
alter table public.announcements add constraint announcements_users_check check (audience <> 'users' or cardinality(user_ids) between 1 and 200);

drop policy "announcements: read" on public.announcements;
create policy "announcements: read"
  on public.announcements for select to authenticated
  using (
    (select public.is_admin())
    or (on_web and (audience in ('all', 'student') or (audience = 'users' and (select auth.uid()) = any (user_ids))))
  );

drop function public.announce_recipients(text);
create function public.announce_recipients(p_audience text, p_ids uuid[] default '{}')
returns table (email text)
language sql
stable
security definer
set search_path = ''
as $$
  select u.email::text
  from auth.users u
  join public.profiles p on p.user_id = u.id
  where (select public.is_admin())
    and u.email is not null
    and u.email_confirmed_at is not null
    and p.announce_email
    and (
      p_audience = 'all'
      or (p_audience = 'student' and p.role = 'student')
      or (p_audience = 'admin' and p.role = 'admin')
      or (p_audience = 'users' and u.id = any (p_ids))
    )
$$;
revoke execute on function public.announce_recipients(text, uuid[]) from public, anon;
grant execute on function public.announce_recipients(text, uuid[]) to authenticated;

-- 4. numbers for /admin.
create function public.admin_overview()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when not (select public.is_admin()) then null else jsonb_build_object(
    'users', jsonb_build_object(
      'total', (select count(*) from auth.users),
      'admins', (select count(*) from public.profiles where role = 'admin'),
      'active7', (select count(*) from public.admin_users() a where a.last_active_at > now() - interval '7 days'),
      'new7', (select count(*) from auth.users where created_at > now() - interval '7 days')
    ),
    'topics', jsonb_build_object(
      'published', (select count(*) from public.topics where status = 'published'),
      'draft', (select count(*) from public.topics where status = 'draft'),
      'waiting', (select count(*) from public.topics where draft_summary is not null)
    ),
    'chapters', (select count(*) from public.chapters where status = 'published'),
    'exercises', (select count(*) from public.code_exercises e join public.chapters c on c.id = e.chapter_id where c.status = 'published'),
    'exams', jsonb_build_object(
      'attempts', (select count(*) from public.exam_attempts where submitted_at is not null),
      'attempts7', (select count(*) from public.exam_attempts where submitted_at > now() - interval '7 days'),
      'passed', (select count(*) from public.exam_attempts where passed),
      'avg_score', (select round(avg(score)) from public.exam_attempts where score is not null)
    ),
    'certificates', (select count(*) from public.certificates),
    'imports', jsonb_build_object(
      'today', (select count(*) from public.import_jobs where created_at > now() - interval '1 day' and not (provider = 'claude' and model = 'manual')),
      'failed7', (select count(*) from public.import_jobs where status = 'failed' and created_at > now() - interval '7 days'),
      'running', (select count(*) from public.import_jobs where status in ('queued', 'rendering', 'drafting'))
    ),
    'signups', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'email', s.email, 'created_at', s.created_at) order by s.created_at desc)
      from (select id, email::text, created_at from auth.users order by created_at desc limit 5) s
    ), '[]'::jsonb),
    'popular', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.learners desc, t.title)
      from (
        select tp.slug, tp.title, count(pg.user_id) as learners
        from public.topics tp join public.progress pg on pg.topic_id = tp.id
        where tp.status = 'published'
        group by tp.slug, tp.title order by count(pg.user_id) desc, tp.title limit 5
      ) t
    ), '[]'::jsonb),
    'activity', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'n', coalesce(l.n, 0)) order by d.day), '[]'::jsonb)
      from generate_series(current_date - 13, current_date, interval '1 day') as d(day)
      left join (select day, count(*) n from public.learning_days group by day) l on l.day = d.day::date
    )
  ) end
$$;
revoke execute on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;
