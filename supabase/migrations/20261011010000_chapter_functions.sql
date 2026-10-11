-- Learner writes for chapters, and chapters in publish_topic.

-- Marks the topic sedang (if new) and remembers the chapter for Dasbor.
create or replace function public.open_chapter(p_chapter uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  c public.chapters;
begin
  if uid is null then
    raise exception 'Masuk dulu' using errcode = '42501';
  end if;
  select * into c from public.chapters ch
  where ch.id = p_chapter and ch.status = 'published'
    and exists (select 1 from public.topics t where t.id = ch.topic_id and t.status = 'published');
  if not found then
    raise exception 'Bab tidak ditemukan' using errcode = 'P0002';
  end if;
  insert into public.progress (user_id, topic_id, state, last_chapter_id)
  values (uid, c.topic_id, 'sedang', c.id)
  on conflict (user_id, topic_id) do update set last_chapter_id = excluded.last_chapter_id;
end;
$$;

-- Progress first, so the selesai trigger below finds the row it updates.
create or replace function public.complete_chapter(p_chapter uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.open_chapter(p_chapter);
  insert into public.chapter_progress (user_id, chapter_id)
  values (auth.uid(), p_chapter)
  on conflict do nothing;
end;
$$;

revoke execute on function public.open_chapter(uuid), public.complete_chapter(uuid) from public, anon;
grant execute on function public.open_chapter(uuid), public.complete_chapter(uuid) to authenticated;

-- A topic without a published exam is selesai once every published
-- chapter is done. Topics with an exam still finish only by passing it.
create or replace function public.finish_topic_by_chapters()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  tid uuid;
begin
  select topic_id into tid from public.chapters where id = new.chapter_id;
  if not exists (select 1 from public.exams where topic_id = tid and status = 'published')
    and not exists (
      select 1 from public.chapters c
      where c.topic_id = tid and c.status = 'published'
        and not exists (select 1 from public.chapter_progress p where p.chapter_id = c.id and p.user_id = new.user_id))
  then
    update public.progress set state = 'selesai' where user_id = new.user_id and topic_id = tid;
  end if;
  return new;
end;
$$;

create trigger finish_topic_by_chapters after insert on public.chapter_progress
  for each row execute function public.finish_topic_by_chapters();

-- Republishing replaces published chapters with drafts. Progress and the
-- resume pointer move to the draft chapter with the same slug.
create or replace function public.carry_chapter_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  successor uuid;
begin
  if old.status = 'published' then
    select id into successor from public.chapters
    where topic_id = old.topic_id and status = 'draft' and slug = old.slug;
    if successor is not null then
      update public.chapter_progress set chapter_id = successor where chapter_id = old.id;
      update public.progress set last_chapter_id = successor where last_chapter_id = old.id;
    end if;
  end if;
  return old;
end;
$$;

create trigger carry_chapter_progress before delete on public.chapters
  for each row execute function public.carry_chapter_progress();

-- publish_topic again, now publishing chapters (progress carried by slug).
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

  if exists (select 1 from public.chapters where topic_id = t.id and status = 'draft') then
    delete from public.chapters where topic_id = t.id and status = 'published';
    update public.chapters set status = 'published' where topic_id = t.id and status = 'draft';
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
