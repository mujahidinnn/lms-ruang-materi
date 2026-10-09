-- exam_attempt_review showed keys once the attempt count reached a full set,
-- even while the set's last attempt was still running. Keys now wait until
-- no attempt is open.

-- Review of a submitted attempt. Explanations always; the correct option
-- only after a pass or once the set's last attempt is used.
create or replace function public.exam_attempt_review(p_attempt uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with a as (
    select a.*, e.max_attempts, e.pass_score,
      exists (select 1 from public.exam_attempts p where p.user_id = a.user_id and p.exam_id = a.exam_id and p.passed)
      or (
        -- An attempt still running would see keys to questions it may share.
        not exists (
          select 1 from public.exam_attempts p
          where p.user_id = a.user_id and p.exam_id = a.exam_id
            and p.submitted_at is null and p.deadline + public.exam_grace() > now()
        )
        and (
          select count(*) from public.exam_attempts p
          where p.user_id = a.user_id and p.exam_id = a.exam_id
        ) % e.max_attempts = 0
      ) as show_keys
    from public.exam_attempts a join public.exams e on e.id = a.exam_id
    where a.id = p_attempt and a.user_id = auth.uid() and a.submitted_at is not null
  )
  select jsonb_build_object(
    'score', a.score, 'passed', a.passed, 'pass_score', a.pass_score, 'show_keys', a.show_keys,
    'questions', (
      select jsonb_agg(jsonb_build_object(
        'prompt', q.prompt, 'code', q.code, 'explanation', q.explanation,
        'options', (select jsonb_agg(q.options[o.value::int + 1] order by o.n)
                    from jsonb_array_elements_text(a.option_orders -> q.id::text) with ordinality o(value, n)),
        'chosen', (a.answers ->> q.id::text)::int,
        'answer', case when a.show_keys then (
          select (o.n - 1)::int from jsonb_array_elements_text(a.option_orders -> q.id::text) with ordinality o(value, n)
          where o.value::int = q.answer
        ) end
      ) order by u.n)
      from unnest(a.question_ids) with ordinality u(qid, n)
      join public.exam_questions q on q.id = u.qid
    )
  )
  from a
$$;
