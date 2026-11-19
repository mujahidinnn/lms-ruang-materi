-- Admin analytics: per topic completion, chapters where learners stop, and
-- the exam questions answered wrong most often. Admin only, null otherwise.
create or replace function public.admin_analytics()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when not (select public.is_admin()) then null else jsonb_build_object(
    'topics', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.started desc, t.title)
      from (
        select tp.slug, tp.title,
          (select count(*) from public.progress g where g.topic_id = tp.id) as started,
          (select count(*) from public.progress g where g.topic_id = tp.id and g.state = 'selesai') as finished
        from public.topics tp where tp.status = 'published'
      ) t
    ), '[]'),
    -- Chapters on topics with at least 3 learners, lowest completion first.
    'chapters', coalesce((
      select jsonb_agg(to_jsonb(c) order by c.done::numeric / c.started, c.started desc)
      from (
        select tp.slug, tp.title as topic, ch.position, ch.title,
          (select count(*) from public.progress g where g.topic_id = tp.id) as started,
          (select count(*) from public.chapter_progress cp where cp.chapter_id = ch.id) as done
        from public.chapters ch join public.topics tp on tp.id = ch.topic_id
        where ch.status = 'published' and tp.status = 'published'
      ) c
      where c.started >= 3
    ), '[]'),
    -- Questions seen in at least 3 submitted attempts; a skipped one counts as wrong.
    'questions', coalesce((
      select jsonb_agg(to_jsonb(r) order by r.wrong::numeric / r.seen desc, r.seen desc)
      from (
        select q.id, tp.slug, tp.title as topic, q.prompt, count(*) as seen,
          count(*) filter (where w.wrong) as wrong
        from public.exam_attempts a
        join public.exam_questions q on q.id = any(a.question_ids)
        join public.exams x on x.id = q.exam_id
        join public.topics tp on tp.id = x.topic_id
        cross join lateral (
          select a.answers ->> q.id::text is null
            or (a.option_orders -> q.id::text ->> (a.answers ->> q.id::text)::int)::int <> q.answer as wrong
        ) w
        where a.submitted_at is not null
        group by q.id, tp.slug, tp.title, q.prompt
        having count(*) >= 3
        order by count(*) filter (where w.wrong)::numeric / count(*) desc, count(*) desc
        limit 10
      ) r
    ), '[]')
  ) end
$$;
revoke execute on function public.admin_analytics() from public, anon;
grant execute on function public.admin_analytics() to authenticated;
