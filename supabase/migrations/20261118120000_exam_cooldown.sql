-- A used-up set of attempts reopens 15 minutes after the last one ended (was 24 hours).
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
  if n > 0 and n % e.max_attempts = 0 and last_end + interval '15 minutes' > now() then
    raise exception 'Percobaan habis, set baru dibuka 15 menit setelah percobaan terakhir' using errcode = 'P0001';
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
