-- Exams are graded here, never in the browser. Learners read their own
-- attempts; only these functions write them, and answer keys leave the
-- database only in a review after a pass or after the last attempt of a set.

create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exam_id uuid not null references public.exams (id) on delete cascade,
  question_ids uuid[] not null,
  -- Per question, the original option index shown at each position.
  option_orders jsonb not null,
  started_at timestamptz not null default now(),
  deadline timestamptz not null,
  submitted_at timestamptz,
  answers jsonb,
  score int check (score between 0 and 100),
  passed boolean,
  created_at timestamptz not null default now()
);

create index on public.exam_attempts (user_id, exam_id);
create index on public.exam_attempts (exam_id);

alter table public.exam_attempts enable row level security;

create policy "exam_attempts: read own or admin" on public.exam_attempts
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- Grace for a submit that leaves the browser right at the deadline.
create or replace function public.exam_grace()
returns interval
language sql
immutable
as $$ select interval '30 seconds' $$;

-- Starts an attempt, or returns the one still running so a reload does not
-- burn an attempt. A set is max_attempts tries; after a failed set the next
-- opens 24 hours after the last one ended. A passed exam is not retaken.
create or replace function public.start_exam_attempt(p_exam uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  e public.exams;
  open_id uuid;
  n int;
  last_end timestamptz;
  ids uuid[];
  orders jsonb;
  new_id uuid;
begin
  if uid is null then
    raise exception 'Masuk dulu untuk ujian' using errcode = '42501';
  end if;
  select * into e from public.exams
  where id = p_exam and status = 'published' and public.topic_is_published(topic_id);
  if not found then
    raise exception 'Ujian tidak ditemukan' using errcode = 'P0002';
  end if;

  -- One learner at a time, so parallel starts cannot pass max_attempts.
  perform 1 from public.profiles where user_id = uid for update;

  select id into open_id from public.exam_attempts
  where user_id = uid and exam_id = e.id and submitted_at is null
    and deadline + public.exam_grace() > now();
  if found then
    return open_id;
  end if;

  if exists (select 1 from public.exam_attempts where user_id = uid and exam_id = e.id and passed) then
    raise exception 'Kamu sudah lulus ujian ini' using errcode = 'P0001';
  end if;

  select count(*), max(coalesce(submitted_at, deadline)) into n, last_end
  from public.exam_attempts where user_id = uid and exam_id = e.id;
  if n > 0 and n % e.max_attempts = 0 and last_end + interval '24 hours' > now() then
    raise exception 'Percobaan habis, set baru dibuka 24 jam setelah percobaan terakhir' using errcode = 'P0001';
  end if;

  select array_agg(id) into ids from (
    select id from public.exam_questions
    where exam_id = e.id and status = 'published'
    order by random() limit e.question_count
  ) q;
  if coalesce(array_length(ids, 1), 0) < e.question_count then
    raise exception 'Bank soal ujian belum cukup' using errcode = 'P0001';
  end if;

  select jsonb_object_agg(q.id, case
    when q.type = 'benar_salah' then to_jsonb(array[0, 1])
    else (select to_jsonb(array_agg(i order by random()))
          from generate_series(0, array_length(q.options, 1) - 1) i)
  end) into orders
  from public.exam_questions q where q.id = any(ids);

  insert into public.exam_attempts (user_id, exam_id, question_ids, option_orders, deadline)
  values (uid, e.id, ids, orders, now() + make_interval(mins => e.duration_minutes))
  returning id into new_id;
  return new_id;
end;
$$;

-- The questions of the caller's attempt, options in their shown order, no keys.
create or replace function public.exam_attempt_questions(p_attempt uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_agg(jsonb_build_object(
    'id', q.id, 'type', q.type, 'prompt', q.prompt, 'code', q.code,
    'options', (select jsonb_agg(q.options[o.value::int + 1] order by o.n)
                from jsonb_array_elements_text(a.option_orders -> q.id::text) with ordinality o(value, n))
  ) order by u.n)
  from public.exam_attempts a
  cross join unnest(a.question_ids) with ordinality u(qid, n)
  join public.exam_questions q on q.id = u.qid
  where a.id = p_attempt and a.user_id = auth.uid()
$$;

create or replace function public.submit_exam_attempt(p_attempt uuid, p_answers jsonb)
returns public.exam_attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  a public.exam_attempts;
  e public.exams;
  correct int;
  total int;
begin
  select * into a from public.exam_attempts where id = p_attempt for update;
  if not found or a.user_id is distinct from uid then
    raise exception 'Percobaan tidak ditemukan' using errcode = '42501';
  end if;
  if a.submitted_at is not null then
    raise exception 'Jawaban sudah dikumpulkan' using errcode = 'P0001';
  end if;
  if now() > a.deadline + public.exam_grace() then
    raise exception 'Waktu ujian sudah habis' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_answers) <> 'object' or exists (
    select 1 from jsonb_object_keys(p_answers) k where not (k::uuid = any(a.question_ids))
  ) then
    raise exception 'Jawaban di luar soal percobaan ini' using errcode = '22023';
  end if;

  -- An answer is a shown position; option_orders maps it back to the key.
  select count(*) filter (
    where (a.option_orders -> q.id::text ->> (p_answers ->> q.id::text)::int)::int = q.answer
  ), count(*) into correct, total
  from public.exam_questions q where q.id = any(a.question_ids);

  select * into e from public.exams where id = a.exam_id;
  update public.exam_attempts
  set submitted_at = now(), answers = p_answers,
      score = round(100.0 * correct / total), passed = round(100.0 * correct / total) >= e.pass_score
  where id = a.id
  returning * into a;

  if a.passed then
    insert into public.progress (user_id, topic_id, state) values (uid, e.topic_id, 'selesai')
    on conflict (user_id, topic_id) do update set state = 'selesai';
  end if;
  return a;
end;
$$;

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
      or (select count(*) from public.exam_attempts p where p.user_id = a.user_id and p.exam_id = a.exam_id) % e.max_attempts = 0
        as show_keys
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

revoke execute on function public.start_exam_attempt(uuid) from public, anon;
revoke execute on function public.exam_attempt_questions(uuid) from public, anon;
revoke execute on function public.submit_exam_attempt(uuid, jsonb) from public, anon;
revoke execute on function public.exam_attempt_review(uuid) from public, anon;
grant execute on function public.start_exam_attempt(uuid) to authenticated;
grant execute on function public.exam_attempt_questions(uuid) to authenticated;
grant execute on function public.submit_exam_attempt(uuid, jsonb) to authenticated;
grant execute on function public.exam_attempt_review(uuid) to authenticated;

-- A published exam keeps a bank of at least twice question_count, the same
-- rule publish_topic() checks, so an edit cannot starve start_exam_attempt.
create or replace function public.check_exam_bank()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  bank int;
begin
  if new.status = 'published' then
    select count(*) into bank from public.exam_questions where exam_id = new.id and status = 'published';
    if bank < 2 * new.question_count then
      raise exception 'Bank soal butuh minimal % soal, baru ada %', 2 * new.question_count, bank using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger check_exam_bank before update of question_count, status on public.exams
  for each row execute function public.check_exam_bank();
