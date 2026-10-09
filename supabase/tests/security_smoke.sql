begin;
select plan(44);

-- Setup as postgres. Murid asks for admin in its metadata.
insert into auth.users (id, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000001', 'murid@contoh.id', '{"role": "admin"}'),
  ('00000000-0000-0000-0000-000000000002', 'lain@contoh.id', '{}'),
  ('00000000-0000-0000-0000-000000000003', 'admin@contoh.id', '{}');
update public.profiles set role = 'admin' where user_id = '00000000-0000-0000-0000-000000000003';

insert into public.topics (id, slug, title, status) values
  ('10000000-0000-0000-0000-000000000001', 'uji-git', 'Git', 'published'),
  ('10000000-0000-0000-0000-000000000002', 'uji-draf', 'Draf', 'draft');
insert into public.tips (topic_id, body, status) values
  ('10000000-0000-0000-0000-000000000001', 'tip terbit', 'published'),
  ('10000000-0000-0000-0000-000000000001', 'tip draf', 'draft'),
  ('10000000-0000-0000-0000-000000000002', 'tip terbit di topik draf', 'published');
insert into public.slides (topic_id, index, path, width, height, status) values
  ('10000000-0000-0000-0000-000000000001', 1, 'git/x/slide-01.avif', 16, 9, 'published');
insert into public.exams (id, topic_id, status, question_count) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'published', 1);
insert into public.exam_questions (exam_id, type, prompt, options, answer, explanation, status) values
  ('20000000-0000-0000-0000-000000000001', 'benar_salah', 'Git itu VCS?', '{Benar,Salah}', 0, 'Ya.', 'published'),
  ('20000000-0000-0000-0000-000000000001', 'benar_salah', 'Commit itu snapshot?', '{Benar,Salah}', 0, 'Ya.', 'published');
insert into public.flashcards (id, topic_id, front, back, position, status)
select ('50000000-0000-0000-0000-0000000000' || lpad(i::text, 2, '0'))::uuid,
  '10000000-0000-0000-0000-000000000001', 'depan ' || i, 'belakang ' || i, i, 'published'
from generate_series(1, 21) i;
insert into public.progress (user_id, topic_id, state) values
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'sedang');
insert into public.tracks (id, slug, title) values
  ('30000000-0000-0000-0000-000000000001', 'uji-track-a', 'A'),
  ('30000000-0000-0000-0000-000000000002', 'uji-track-b', 'B');
insert into public.track_nodes (id, track_id, topic_id) values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001');
insert into public.track_edges (from_node_id, to_node_id) values
  ('40000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002');

select throws_ok(
  $$ insert into public.track_edges (from_node_id, to_node_id)
     values ('40000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001') $$,
  'P0001',
  'Prasyarat ini membuat lingkaran',
  'roadmap cycles are rejected'
);

select throws_ok(
  $$ insert into public.track_edges (from_node_id, to_node_id)
     values ('40000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003') $$,
  'P0001',
  'Prasyarat harus dari track yang sama',
  'cross-track edges are rejected'
);

select throws_ok(
  $$ update public.track_nodes set track_id = '30000000-0000-0000-0000-000000000002'
     where id = '40000000-0000-0000-0000-000000000002' $$,
  'P0001',
  null,
  'a node cannot move to another track'
);

select is(
  (select role from public.profiles where user_id = '00000000-0000-0000-0000-000000000001'),
  'student',
  'sign-up with role metadata still yields student'
);

select throws_ok(
  $$ insert into public.practice_questions (topic_id, type, prompt, options, answer, explanation)
     values ('10000000-0000-0000-0000-000000000001', 'pilihan_ganda', 'x', '{a,b}', 0, 'x') $$,
  '23514',
  null,
  'pilihan_ganda needs 4 options'
);

select throws_ok(
  $$ insert into public.topics (slug, title) values ('Bukan Slug', 'x') $$,
  '23514',
  null,
  'slug must be kebab-case'
);

-- Anon
set local role anon;

select results_eq(
  $$ select slug from public.topics where slug like 'uji-%' $$,
  array['uji-git'],
  'anon sees only published topics'
);

select results_eq(
  $$ select body from public.tips where topic_id::text like '10000000-%' $$,
  array['tip terbit'],
  'anon sees only published tips of published topics'
);

select is_empty(
  $$ select 1 from public.exam_questions $$,
  'anon cannot read exam_questions'
);

select is_empty(
  $$ select 1 from public.track_nodes where id::text like '40000000-%' $$,
  'anon cannot read draft roadmap nodes'
);

select throws_ok(
  $$ select * from public.profiles $$,
  '42501',
  null,
  'anon cannot read profiles'
);

reset role;

-- Student
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$ update public.profiles set role = 'admin' where user_id = auth.uid() $$,
  '42501',
  null,
  'learner cannot update own role'
);

select lives_ok(
  $$ update public.profiles set display_name = 'Murid', timezone = 'Asia/Makassar' where user_id = auth.uid() $$,
  'learner can update display_name and timezone'
);

select is(
  (select count(*)::int from public.profiles),
  1,
  'learner sees only own profile'
);

select throws_ok(
  $$ insert into public.profiles (user_id, role) values (auth.uid(), 'admin') $$,
  '42501',
  null,
  'learner cannot insert a profile'
);

select is_empty(
  $$ select 1 from public.topics where status = 'draft' $$,
  'learner cannot read draft topics'
);

select is_empty(
  $$ select 1 from public.exam_questions $$,
  'learner cannot read exam_questions'
);

select throws_ok(
  $$ insert into public.topics (slug, title) values ('baru', 'Baru') $$,
  '42501',
  null,
  'learner cannot write content'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('imports', 'x.pptx') $$,
  '42501',
  null,
  'learner cannot upload to imports'
);

select throws_ok(
  $$ insert into public.import_jobs (file_path, slug, provider, model, slide_count)
     values ('migrasi/uji-git.pptx', 'uji-git', 'gemini', 'm', 10) $$,
  '42501',
  null,
  'learner cannot create import jobs'
);

select throws_ok(
  $$ select public.publish_topic('uji-git') $$,
  '42501',
  null,
  'learner cannot publish'
);

select throws_ok(
  $$ select public.publish_track('uji-track-b') $$,
  '42501',
  null,
  'learner cannot publish a track'
);

select is_empty(
  $$ select 1 from public.progress $$,
  'learner cannot read another learner''s progress'
);

select throws_ok(
  $$ insert into public.flashcard_reviews (user_id, flashcard_id, box, due_on, reviewed_at, added_on)
     values (auth.uid(), '50000000-0000-0000-0000-000000000001', 5, current_date + 99, now(), current_date) $$,
  '42501',
  null,
  'learner cannot write flashcard_reviews directly'
);

select throws_ok(
  $$ select public.review_flashcard('50000000-0000-0000-0000-000000000001', 3) $$,
  'P0001',
  'Buka topiknya di Belajar dulu',
  'new cards need the topic opened in Belajar'
);

select throws_ok(
  $$ insert into public.progress (topic_id, state) values ('10000000-0000-0000-0000-000000000001', 'selesai') $$,
  '42501',
  'Topik ini selesai lewat ujian',
  'learner cannot mark a topic with an exam selesai'
);

select lives_ok(
  $$ insert into public.progress (topic_id) values ('10000000-0000-0000-0000-000000000001') $$,
  'learner opens a topic'
);

select is(
  (select row(box, due_on - public.learner_today()) from public.review_flashcard('50000000-0000-0000-0000-000000000001', 3)),
  row(2, 2),
  'Bisa on a new card: box 2, due in 2 days'
);

select is(
  (select row(box, due_on - public.learner_today()) from public.review_flashcard('50000000-0000-0000-0000-000000000001', 3)),
  row(3, 4),
  'Bisa again: box 3, due in 4 days'
);

select is(
  (select row(box, due_on - public.learner_today()) from public.review_flashcard('50000000-0000-0000-0000-000000000001', 1)),
  row(1, 1),
  'Lupa: back to box 1, due tomorrow'
);

select lives_ok(
  $$ select public.review_flashcard(('50000000-0000-0000-0000-0000000000' || lpad(i::text, 2, '0'))::uuid, 2)
     from generate_series(2, 20) i $$,
  'learner adds 20 new cards in a day'
);

select throws_ok(
  $$ select public.review_flashcard('50000000-0000-0000-0000-000000000021', 2) $$,
  'P0001',
  'Sudah 20 kartu baru hari ini, lanjut besok',
  'the 21st new card in a day is refused'
);

insert into public.practice_sessions (topic_id, correct, total, finished_at)
values ('10000000-0000-0000-0000-000000000001', 3, 5, '2000-01-01');

select is(
  (select finished_at from public.practice_sessions where user_id = auth.uid()),
  now(),
  'practice finished_at is stamped by the database'
);

reset role;

-- Admin
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000003", "role": "authenticated"}';

select is(
  (select count(*)::int from public.topics where slug like 'uji-%'),
  2,
  'admin reads drafts'
);

select is(
  (select count(*)::int from public.exam_questions where exam_id = '20000000-0000-0000-0000-000000000001'),
  2,
  'admin reads exam_questions'
);

select throws_ok(
  $$ insert into public.import_jobs (file_path, slug, provider, model, slide_count)
     values ('../../etc/passwd', 'uji-git', 'gemini', 'm', 10) $$,
  '23514',
  null,
  'job file_path must be a generated name'
);

select lives_ok(
  $$ insert into public.import_jobs (file_path, slug, provider, model, slide_count)
     values ('migrasi/uji-git.pptx', 'uji-git', 'gemini', 'm', 10) $$,
  'admin creates an import job'
);

select throws_ok(
  $$ insert into public.import_jobs (file_path, slug, provider, model, slide_count)
     values ('migrasi/uji-git.pptx', 'uji-git', 'gemini', 'm', 10) $$,
  'P0001',
  null,
  'only one active import at a time'
);

select throws_ok(
  $$ update public.import_jobs set status = 'done' $$,
  '42501',
  null,
  'admin cannot set job status, only the worker'
);

select lives_ok(
  $$ select public.publish_topic('uji-git') $$,
  'admin publishes a topic'
);

select results_eq(
  $$ select body from public.tips where topic_id = '10000000-0000-0000-0000-000000000001' and status = 'published' $$,
  array['tip draf'],
  'publish replaces published tips with drafts'
);

select throws_ok(
  $$ select public.publish_track('uji-track-a') $$,
  'P0001',
  'Semua topik di track harus sudah terbit',
  'a track with a draft topic cannot be published'
);

select lives_ok(
  $$ select public.publish_track('uji-track-b') $$,
  'admin publishes a track'
);

reset role;
set local role anon;

select results_eq(
  $$ select t.slug from public.tracks t join public.track_nodes n on n.track_id = t.id where t.slug like 'uji-%' $$,
  array['uji-track-b'],
  'anon reads a published track and its nodes'
);

select * from finish();
rollback;
