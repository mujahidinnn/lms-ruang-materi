-- Fixes from the multi-agent review of 2026-10-10.

-- Progress: a learner may move only state and last_slide, never re-point a
-- row at another topic (that skipped the exam guard and the publish check).
revoke update on public.progress from authenticated;
grant update (state, last_slide) on public.progress to authenticated;

create or replace function public.check_progress()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (new.topic_id <> old.topic_id or new.user_id <> old.user_id) then
    raise exception 'Progress tidak bisa dipindah' using errcode = '42501';
  end if;
  new.updated_at := now();
  if new.state = 'selesai'
    and (tg_op = 'INSERT' or old.state <> 'selesai')
    and current_user in ('authenticated', 'anon')
    and exists (select 1 from public.exams where topic_id = new.topic_id and status = 'published')
  then
    raise exception 'Topik ini selesai lewat ujian' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Opening a topic, moving through its slides, or marking it selesai or
-- dilewati. Runs as the caller, so RLS, column grants and check_progress
-- all apply. A revisit keeps the state and moves updated_at.
create or replace function public.touch_progress(p_topic uuid, p_state public.progress_state default null, p_slide int default null)
returns void
language sql
set search_path = ''
as $$
  insert into public.progress (topic_id, state, last_slide)
  values (p_topic, coalesce(p_state, 'sedang'), coalesce(p_slide, 0))
  on conflict (user_id, topic_id) do update
    set state = coalesce(p_state, public.progress.state),
        last_slide = coalesce(p_slide, public.progress.last_slide)
$$;

revoke execute on function public.touch_progress(uuid, public.progress_state, int) from public, anon;
grant execute on function public.touch_progress(uuid, public.progress_state, int) to authenticated;

-- Minors: no learning row is saved until the learner confirms they are 18+
-- or a guardian agreed (GUIDELINE, Privacy). Admins are exempt.
create or replace function public.require_consent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles
    where user_id = new.user_id and (guardian_consent or role = 'admin')
  ) then
    raise exception 'Konfirmasi persetujuan dulu di halaman Profil' using errcode = 'P0001', hint = 'consent';
  end if;
  return new;
end;
$$;

create trigger require_consent before insert on public.progress
  for each row execute function public.require_consent();
create trigger require_consent before insert on public.practice_sessions
  for each row execute function public.require_consent();
create trigger require_consent before insert on public.flashcard_reviews
  for each row execute function public.require_consent();
create trigger require_consent before insert on public.exam_attempts
  for each row execute function public.require_consent();

-- Exam questions that an attempt used are archived instead of deleted, so
-- old reviews and running attempts keep their questions. Covers publish_topic
-- replacing the bank and an admin deleting a row. A cascade from deleting the
-- whole exam or topic (trigger depth > 1) still deletes.
create index if not exists exam_attempts_question_ids on public.exam_attempts using gin (question_ids);

create or replace function public.archive_used_exam_question()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if pg_trigger_depth() = 1
    and exists (select 1 from public.exam_attempts where question_ids @> array[old.id])
  then
    update public.exam_questions set status = 'archived' where id = old.id;
    return null;
  end if;
  return old;
end;
$$;

create trigger archive_used_exam_question before delete on public.exam_questions
  for each row execute function public.archive_used_exam_question();

-- The 2x bank rule, checked at commit so publish_topic can swap banks.
create or replace function public.check_exam_bank_rows()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  e public.exams;
  bank int;
begin
  select * into e from public.exams where id = old.exam_id;
  if found and e.status = 'published' then
    select count(*) into bank from public.exam_questions where exam_id = e.id and status = 'published';
    if bank < 2 * e.question_count then
      raise exception 'Bank soal ujian minimal % soal terbit, tinggal %', 2 * e.question_count, bank using errcode = 'P0001';
    end if;
  end if;
  return null;
end;
$$;

create constraint trigger check_exam_bank_rows after delete or update of status on public.exam_questions
  deferrable initially deferred
  for each row execute function public.check_exam_bank_rows();

-- Re-importing a published topic replaces its flashcards. A learner's
-- Leitner box moves to the new card with the same front, so republishing
-- does not wipe schedules. Cards with no match lose their reviews.
create or replace function public.carry_flashcard_reviews()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  successor uuid;
begin
  if old.status = 'published' then
    select id into successor from public.flashcards
    where topic_id = old.topic_id and status = 'draft'
      and lower(btrim(front)) = lower(btrim(old.front))
    limit 1;
    if successor is not null then
      update public.flashcard_reviews r set flashcard_id = successor
      where r.flashcard_id = old.id
        and not exists (select 1 from public.flashcard_reviews x where x.user_id = r.user_id and x.flashcard_id = successor);
    end if;
  end if;
  return old;
end;
$$;

create trigger carry_flashcard_reviews before delete on public.flashcards
  for each row execute function public.carry_flashcard_reviews();

-- Lencana for learners who had already passed every core topic when the
-- track (or its last core node) went public.
create or replace function public.backfill_badges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.badges (user_id, track_id)
  select u.user_id, new.id
  from (
    select distinct a.user_id
    from public.exam_attempts a
    join public.exams e on e.id = a.exam_id
    join public.track_nodes n on n.topic_id = e.topic_id and n.track_id = new.id
    where a.passed
  ) u
  where exists (select 1 from public.track_nodes c where c.track_id = new.id and not c.optional and c.status = 'published')
    and not exists (
      select 1 from public.track_nodes c
      where c.track_id = new.id and not c.optional and c.status = 'published'
        and not public.topic_passed(u.user_id, c.topic_id)
    )
  on conflict do nothing;
  return new;
end;
$$;

create trigger backfill_badges after update of status on public.tracks
  for each row when (new.status = 'published') execute function public.backfill_badges();

-- Streaks and the daily new-card quota are dated in the profile timezone, so
-- a learner may change it once a day, not hop zones to count a day twice.
alter table public.profiles add column timezone_changed_at timestamptz;

create or replace function public.limit_timezone_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.timezone is distinct from old.timezone then
    if current_user = 'authenticated' and old.timezone_changed_at > now() - interval '24 hours' then
      raise exception 'Zona waktu hanya bisa diganti sekali sehari' using errcode = 'P0001';
    end if;
    new.timezone_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger limit_timezone_change before update on public.profiles
  for each row execute function public.limit_timezone_change();

-- publish_topic again, now leaving archived exam questions archived.
create or replace function public.publish_topic(p_slug text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.topics;
  e public.exams;
  bank int;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin' using errcode = '42501';
  end if;

  select * into t from public.topics where slug = p_slug for update;
  if not found then
    raise exception 'Topik tidak ditemukan' using errcode = 'P0002';
  end if;

  if exists (select 1 from public.slides where topic_id = t.id and status = 'draft') then
    delete from public.slides where topic_id = t.id and status = 'published';
    update public.slides set status = 'published' where topic_id = t.id;
  end if;
  if not exists (select 1 from public.slides where topic_id = t.id) then
    raise exception 'Topik belum punya slide' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.tips where topic_id = t.id and status = 'draft') then
    delete from public.tips where topic_id = t.id and status = 'published';
    update public.tips set status = 'published' where topic_id = t.id;
  end if;

  if exists (select 1 from public.flashcards where topic_id = t.id and status = 'draft') then
    delete from public.flashcards where topic_id = t.id and status = 'published';
    update public.flashcards set status = 'published' where topic_id = t.id;
  end if;

  if exists (select 1 from public.practice_questions where topic_id = t.id and status = 'draft') then
    delete from public.practice_questions where topic_id = t.id and status = 'published';
    update public.practice_questions set status = 'published' where topic_id = t.id;
  end if;

  select * into e from public.exams where topic_id = t.id;
  if found then
    if exists (select 1 from public.exam_questions where exam_id = e.id and status = 'draft') then
      delete from public.exam_questions where exam_id = e.id and status = 'published';
      update public.exam_questions set status = 'published' where exam_id = e.id and status = 'draft';
    end if;

    if exists (
      select 1 from public.exam_questions q
      join public.practice_questions p on p.topic_id = t.id
        and lower(btrim(p.prompt)) = lower(btrim(q.prompt))
      where q.exam_id = e.id and q.status = 'published'
    ) then
      raise exception 'Ada soal ujian yang sama dengan soal latihan' using errcode = 'P0001';
    end if;

    select count(*) into bank from public.exam_questions where exam_id = e.id and status = 'published';
    if bank > 0 then
      if bank < 2 * e.question_count then
        raise exception 'Bank soal ujian butuh minimal % soal, baru ada %', 2 * e.question_count, bank
          using errcode = 'P0001';
      end if;
      update public.exams set status = 'published' where id = e.id;
    end if;
  end if;

  update public.topics
  set status = 'published',
      summary = coalesce(draft_summary, summary),
      draft_summary = null
  where id = t.id;
end;
$$;
