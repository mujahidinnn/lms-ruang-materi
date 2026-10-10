-- Fixes from the Supabase best-practices audit (skills: supabase,
-- supabase-postgres-best-practices), 2026-10-10.

-- Only a real review counts as a learning day. republishing a topic moves
-- flashcard_id on reviews (carry_flashcard_reviews) and must not log one.
drop trigger log_learning_day on public.flashcard_reviews;
create trigger log_learning_day after insert or update of reviewed_at on public.flashcard_reviews
  for each row execute function public.log_learning_day();

-- Public read policies: an IN subquery is planned once (hashed), where a
-- security definer function per row is not. The subqueries run under the
-- caller's own RLS on topics and tracks, which already shows only published
-- rows to anon and learners, so the meaning is unchanged.
drop policy "slides: read published" on public.slides;
create policy "slides: read published" on public.slides for select to anon, authenticated
  using (status = 'published' and topic_id in (select id from public.topics where status = 'published'));
drop policy "tips: read published" on public.tips;
create policy "tips: read published" on public.tips for select to anon, authenticated
  using (status = 'published' and topic_id in (select id from public.topics where status = 'published'));
drop policy "flashcards: read published" on public.flashcards;
create policy "flashcards: read published" on public.flashcards for select to anon, authenticated
  using (status = 'published' and topic_id in (select id from public.topics where status = 'published'));
drop policy "practice_questions: read published" on public.practice_questions;
create policy "practice_questions: read published" on public.practice_questions for select to anon, authenticated
  using (status = 'published' and topic_id in (select id from public.topics where status = 'published'));
drop policy "exams: read published" on public.exams;
create policy "exams: read published" on public.exams for select to anon, authenticated
  using (status = 'published' and topic_id in (select id from public.topics where status = 'published'));

drop policy "track_nodes: read published" on public.track_nodes;
create policy "track_nodes: read published" on public.track_nodes for select to anon, authenticated
  using (status = 'published'
    and track_id in (select id from public.tracks where status = 'published')
    and topic_id in (select id from public.topics where status = 'published'));

drop policy "track_edges: read published" on public.track_edges;
create policy "track_edges: read published" on public.track_edges for select to anon, authenticated
  using (status = 'published'
    and from_node_id in (select n.id from public.track_nodes n
          join public.tracks tr on tr.id = n.track_id and tr.status = 'published'
          join public.topics tp on tp.id = n.topic_id and tp.status = 'published'
          where n.status = 'published')
    and to_node_id in (select n.id from public.track_nodes n
          join public.tracks tr on tr.id = n.track_id and tr.status = 'published'
          join public.topics tp on tp.id = n.topic_id and tp.status = 'published'
          where n.status = 'published'));

-- Foreign keys without an index: account deletion nulls updated_by on every
-- content table, and topic or track deletes cascade into these.
create index if not exists practice_sessions_topic_id_idx on public.practice_sessions (topic_id);
create index if not exists badges_track_id_idx on public.badges (track_id);
create index if not exists import_jobs_created_by_idx on public.import_jobs (created_by) where created_by is not null;
do $$
declare t text;
begin
  foreach t in array array['topics','slides','tips','flashcards','practice_questions','exams','exam_questions','tracks','track_nodes','track_edges'] loop
    execute format('create index if not exists %I on public.%I (updated_by) where updated_by is not null', t || '_updated_by_idx', t);
  end loop;
end $$;

-- slides(topic_id) is the leading column of the (topic_id, status, index)
-- unique key already.
drop index if exists public.slides_topic_id_idx;

-- Security definer helpers keep the default PUBLIC execute grant otherwise.
-- Policies for authenticated still use topic_is_published and is_admin;
-- every other caller is a security definer function running as the owner.
revoke execute on function public.track_is_published(uuid), public.node_is_published(uuid) from public, anon, authenticated;
revoke execute on function public.topic_is_published(uuid), public.is_admin(), public.learner_today() from public, anon;
grant execute on function public.topic_is_published(uuid), public.is_admin(), public.learner_today() to authenticated;

-- Fixed search_path on the remaining functions (advisor lint
-- function_search_path_mutable).
alter function public.is_valid_timezone(text) set search_path = '';
alter function public.set_updated_by() set search_path = '';
alter function public.valid_question(public.question_type, text[], int, text) set search_path = '';
alter function public.touch_updated_at() set search_path = '';
alter function public.keep_node_track() set search_path = '';
alter function public.stamp_finished_at() set search_path = '';
alter function public.exam_grace() set search_path = '';

-- An import job records the admin who started it, not anyone they name.
alter policy "import_jobs: admin insert" on public.import_jobs
  with check ((select public.is_admin()) and created_by = (select auth.uid()));

-- auth.uid() once per call, not per candidate card.
create or replace function public.flashcard_queue()
returns table (id uuid, front text, back text, topic text, box int)
language sql
stable
security definer
set search_path = ''
as $$
  with today as (select public.learner_today() as d),
  due as (
    select f.id, f.front, f.back, t.title as topic, r.box, r.due_on as sort_on, f.position
    from public.flashcard_reviews r
    join public.flashcards f on f.id = r.flashcard_id and f.status = 'published'
    join public.topics t on t.id = f.topic_id and t.status = 'published'
    where r.user_id = (select auth.uid()) and r.due_on <= (select d from today)
  ),
  quota as (
    select greatest(0, 20 - count(*))::int as n from public.flashcard_reviews
    where user_id = (select auth.uid()) and added_on = (select d from today)
  ),
  fresh as (
    select f.id, f.front, f.back, t.title as topic, null::int as box, p.created_at::date as sort_on, f.position
    from public.progress p
    join public.topics t on t.id = p.topic_id and t.status = 'published'
    join public.flashcards f on f.topic_id = t.id and f.status = 'published'
    where p.user_id = (select auth.uid())
      and not exists (select 1 from public.flashcard_reviews r where r.user_id = (select auth.uid()) and r.flashcard_id = f.id)
    order by p.created_at, f.position
    limit (select n from quota)
  )
  select id, front, back, topic, box from (
    select * from due union all select * from fresh
  ) q
  order by box is null, sort_on, position
$$;
