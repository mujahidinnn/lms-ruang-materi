-- Admin Pengguna: one learner's recap (activity, practice, per-topic progress).
-- Returns null for non-admins. Published content only, submitted exams only.
create function public.admin_user_recap(target uuid)
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
