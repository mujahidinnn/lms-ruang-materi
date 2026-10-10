begin;
select plan(80);

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
-- Both learners confirmed guardian consent; require_consent is tested below.
update public.profiles set guardian_consent = true
where user_id in ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
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
-- Track B is live from the start so passing its one core topic grants lencana.
update public.tracks set status = 'published' where id = '30000000-0000-0000-0000-000000000002';
update public.track_nodes set status = 'published' where id = '40000000-0000-0000-0000-000000000003';

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
  $$ select 1 from public.track_nodes where track_id = '30000000-0000-0000-0000-000000000001' $$,
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

select is(
  (select count(*)::int from public.learning_days where user_id = auth.uid()),
  1,
  'learning activity logs one day'
);

select throws_ok(
  $$ insert into public.learning_days (user_id, day) values (auth.uid(), current_date - 1) $$,
  '42501',
  null,
  'learner cannot write learning days'
);

select throws_ok(
  $$ insert into public.badges (user_id, track_id) values (auth.uid(), '30000000-0000-0000-0000-000000000002') $$,
  '42501',
  null,
  'learner cannot grant themselves lencana'
);

select throws_ok(
  $$ select public.topic_passed('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001') $$,
  '42501',
  null,
  'learner cannot ask whether another learner passed'
);

-- Exam: bank of 2 benar/salah questions, 1 per attempt, 3 attempts, pass 70.
-- Shown position 0 holds the key (both answers are 0, benar_salah keeps order).
select isnt(public.start_exam_attempt('20000000-0000-0000-0000-000000000001'), null, 'learner starts an exam');

select is(
  public.start_exam_attempt('20000000-0000-0000-0000-000000000001'),
  (select id from public.exam_attempts where user_id = auth.uid() and submitted_at is null),
  'starting again resumes the open attempt instead of using another'
);

select is(
  (select bool_or(q ? 'answer') from jsonb_array_elements(public.exam_attempt_questions(
    (select id from public.exam_attempts where user_id = auth.uid() and submitted_at is null))) q),
  false,
  'attempt questions carry no answer key'
);

select throws_ok(
  $$ select public.submit_exam_attempt(
       (select id from public.exam_attempts where user_id = auth.uid() and submitted_at is null),
       '{"10000000-0000-0000-0000-000000000001": 0}') $$,
  '22023',
  null,
  'answers outside the attempt questions are rejected'
);

select is(
  (select row(score, passed) from public.submit_exam_attempt(
    (select id from public.exam_attempts where user_id = auth.uid() and submitted_at is null),
    (select jsonb_build_object(question_ids[1], 1) from public.exam_attempts where user_id = auth.uid() and submitted_at is null))),
  row(0, false),
  'a wrong answer is graded on the server'
);

select throws_ok(
  $$ select public.submit_exam_attempt((select id from public.exam_attempts where user_id = auth.uid()), '{}') $$,
  'P0001',
  'Jawaban sudah dikumpulkan',
  'a second submit is rejected'
);

select is(
  (select bool_and(q -> 'answer' = 'null'::jsonb) from jsonb_array_elements(
    public.exam_attempt_review((select id from public.exam_attempts where user_id = auth.uid())) -> 'questions') q),
  true,
  'the key stays hidden after a failed attempt with attempts left'
);

select public.start_exam_attempt('20000000-0000-0000-0000-000000000001');
reset role;
update public.exam_attempts set deadline = now() - interval '1 hour' where submitted_at is null;
set local role authenticated;

select throws_ok(
  $$ select public.submit_exam_attempt(
       (select id from public.exam_attempts where user_id = auth.uid() and submitted_at is null), '{}') $$,
  'P0001',
  'Waktu ujian sudah habis',
  'a late submit is rejected'
);

select public.start_exam_attempt('20000000-0000-0000-0000-000000000001');

select is(
  (select bool_and(q -> 'answer' = 'null'::jsonb) from jsonb_array_elements(
    public.exam_attempt_review((select id from public.exam_attempts where user_id = auth.uid() and submitted_at is not null)) -> 'questions') q),
  true,
  'keys stay hidden while the last attempt of a set is running'
);

select public.submit_exam_attempt(
  (select id from public.exam_attempts where user_id = auth.uid() and submitted_at is null and deadline > now()), '{}'
);

select is(
  (select bool_and(q -> 'answer' = '0'::jsonb) from jsonb_array_elements(
    public.exam_attempt_review((select id from public.exam_attempts where user_id = auth.uid() and submitted_at is not null order by score limit 1)) -> 'questions') q),
  true,
  'the key shows after the last attempt of a set'
);

select throws_ok(
  $$ select public.start_exam_attempt('20000000-0000-0000-0000-000000000001') $$,
  'P0001',
  'Percobaan habis, set baru dibuka 24 jam setelah percobaan terakhir',
  'no fourth attempt within 24 hours'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000002", "role": "authenticated"}';

select throws_ok(
  $$ select public.submit_exam_attempt((select id from public.exam_attempts limit 1), '{}') $$,
  '42501',
  null,
  'a learner cannot submit another learner''s attempt'
);

select public.start_exam_attempt('20000000-0000-0000-0000-000000000001');

select is(
  (select passed from public.submit_exam_attempt(
    (select id from public.exam_attempts where user_id = auth.uid()),
    (select jsonb_build_object(question_ids[1], 0) from public.exam_attempts where user_id = auth.uid()))),
  true,
  'a right answer passes'
);

select is(
  (select state from public.progress where user_id = auth.uid() and topic_id = '10000000-0000-0000-0000-000000000001'),
  'selesai'::public.progress_state,
  'passing the exam marks the topic selesai'
);

select results_eq(
  $$ select track_id::text from public.badges where user_id = auth.uid() $$,
  array['30000000-0000-0000-0000-000000000002'],
  'passing the last core topic of a track grants its lencana'
);

select is(
  (select row(core_passed, core_total) from public.track_levels where slug = 'uji-track-b'),
  row(1, 1),
  'track level counts core topics passed by exam'
);

select is(
  (select row(current_days, best_days) from public.learning_streaks where user_id = auth.uid()),
  row(1, 1),
  'a learning day starts a streak'
);

select throws_ok(
  $$ select public.start_exam_attempt('20000000-0000-0000-0000-000000000001') $$,
  'P0001',
  'Kamu sudah lulus ujian ini',
  'a passed exam is not retaken'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated"}';

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

select throws_ok(
  $$ update public.exams set question_count = 2 where id = '20000000-0000-0000-0000-000000000001' $$,
  'P0001',
  null,
  'a published exam keeps a bank of twice question_count'
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

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000003", "role": "authenticated"}';

select throws_ok(
  $$ select public.delete_own_account() $$,
  'P0001',
  null,
  'an admin cannot delete their own account from the app'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000002", "role": "authenticated"}';

select lives_ok($$ select public.delete_own_account() $$, 'a learner deletes their account');

reset role;

select is(
  (select count(*)::int from (
    select user_id from public.profiles union all select user_id from public.progress
    union all select user_id from public.flashcard_reviews union all select user_id from public.practice_sessions
    union all select user_id from public.exam_attempts union all select user_id from public.badges
    union all select user_id from public.learning_days
  ) r where user_id = '00000000-0000-0000-0000-000000000002'),
  0,
  'deleting an account leaves no learner rows'
);

select is(
  (select count(*)::int from public.topics where slug like 'uji-%'),
  2,
  'deleting an account keeps the content'
);

-- Review fixes (2026-10-10).
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000004', 'baru@contoh.id');
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000004", "role": "authenticated"}';

select throws_ok(
  $$ select public.touch_progress('10000000-0000-0000-0000-000000000001') $$,
  'P0001',
  'Konfirmasi persetujuan dulu di halaman Profil',
  'no progress is saved before guardian consent'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select lives_ok(
  $$ select public.touch_progress('10000000-0000-0000-0000-000000000001', null, 5) $$,
  'touch_progress saves the last slide'
);

select is(
  (select last_slide from public.progress where user_id = auth.uid() and topic_id = '10000000-0000-0000-0000-000000000001'),
  5,
  'last slide is stored'
);

select throws_ok(
  $$ update public.progress set topic_id = '10000000-0000-0000-0000-000000000002' where user_id = auth.uid() $$,
  '42501',
  null,
  'a progress row cannot be moved to another topic'
);

select lives_ok(
  $$ update public.profiles set timezone = 'Asia/Makassar' where user_id = auth.uid() $$,
  'first timezone change of the day works'
);

select throws_ok(
  $$ update public.profiles set timezone = 'Pacific/Kiritimati' where user_id = auth.uid() $$,
  'P0001',
  'Zona waktu hanya bisa diganti sekali sehari',
  'a second timezone change the same day is refused'
);

reset role;
set constraints all immediate;

-- A third question keeps the 2x bank when one used question is archived.
insert into public.exam_questions (exam_id, type, prompt, options, answer, explanation, status) values
  ('20000000-0000-0000-0000-000000000001', 'benar_salah', 'Branch itu pointer?', '{Benar,Salah}', 0, 'Ya.', 'published');

delete from public.exam_questions
where id = (select question_ids[1] from public.exam_attempts where user_id = '00000000-0000-0000-0000-000000000001' limit 1);

select is(
  (select status::text from public.exam_questions
   where id = (select question_ids[1] from public.exam_attempts where user_id = '00000000-0000-0000-0000-000000000001' limit 1)),
  'archived',
  'a question an attempt used is archived, not deleted'
);

select throws_ok(
  $$ delete from public.exam_questions
     where exam_id = '20000000-0000-0000-0000-000000000001' and status = 'published'
       and not exists (select 1 from public.exam_attempts a where a.question_ids @> array[exam_questions.id]) $$,
  'P0001',
  null,
  'deleting below the 2x bank of a published exam is refused'
);

insert into public.flashcards (id, topic_id, front, back, position, status) values
  ('50000000-0000-0000-0000-000000000099', '10000000-0000-0000-0000-000000000001', 'Depan 1 ', 'baru', 1, 'draft');
delete from public.flashcards where id = '50000000-0000-0000-0000-000000000001';

select is(
  (select count(*)::int from public.flashcard_reviews
   where user_id = '00000000-0000-0000-0000-000000000001' and flashcard_id = '50000000-0000-0000-0000-000000000099'),
  1,
  'republished flashcards keep the learner''s Leitner box'
);

select * from finish();
rollback;
