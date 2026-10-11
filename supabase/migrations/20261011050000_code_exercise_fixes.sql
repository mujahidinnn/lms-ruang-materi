-- Review fixes for code exercises. An exercise counts toward a chapter only
-- once it has checks and is of a kind the app can run (a fresh admin row
-- has none and would block every learner). Stored passing code is an object
-- and stays small.

create or replace function public.counted_exercise(e public.code_exercises)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_array_length(e.tests) > 0 and e.kind in ('web', 'js', 'express');
$$;

create or replace function public.complete_chapter(p_chapter uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.open_chapter(p_chapter);
  if exists (
    select 1 from public.code_exercises e
    where e.chapter_id = p_chapter and public.counted_exercise(e)
      and not exists (select 1 from public.code_progress p where p.exercise_id = e.id and p.user_id = auth.uid())
  ) then
    raise exception 'Selesaikan latihan kode di bab ini dulu' using errcode = 'P0001';
  end if;
  insert into public.chapter_progress (user_id, chapter_id)
  values (auth.uid(), p_chapter)
  on conflict do nothing;
end;
$$;

create or replace function public.pass_code_exercise(p_exercise uuid, p_code jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Masuk dulu' using errcode = '42501';
  end if;
  if jsonb_typeof(p_code) is distinct from 'object' or octet_length(p_code::text) > 65536 then
    raise exception 'Kode tidak valid' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.code_exercises e
    join public.chapters c on c.id = e.chapter_id and c.status = 'published'
    join public.topics t on t.id = c.topic_id and t.status = 'published'
    where e.id = p_exercise
  ) then
    raise exception 'Latihan tidak ditemukan' using errcode = 'P0002';
  end if;
  insert into public.code_progress (user_id, exercise_id, code) values (uid, p_exercise, p_code)
  on conflict (user_id, exercise_id) do update set code = excluded.code, passed_at = now();
end;
$$;
