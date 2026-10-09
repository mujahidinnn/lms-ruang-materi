-- Learner rows: progress per topic, practice sessions, flashcard reviews.
-- Learners read their own rows, admins read all. Writes are narrow: progress
-- by its owner, practice sessions insert only, reviews only through
-- review_flashcard().

create type public.progress_state as enum ('belum', 'sedang', 'selesai', 'dilewati');

-- The learner's calendar day, in their profile timezone.
create or replace function public.learner_today()
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select (now() at time zone coalesce(
    (select timezone from public.profiles where user_id = auth.uid()),
    'Asia/Jakarta'
  ))::date
$$;

create table public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  state public.progress_state not null default 'sedang',
  last_slide int not null default 0 check (last_slide >= 0),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, topic_id)
);

-- selesai comes from passing the exam (submit_exam_attempt, a security
-- definer function, so current_user is its owner there). A learner may mark
-- it only on a topic without one. Not security definer on purpose.
create or replace function public.check_progress()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
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

create trigger check_progress before insert or update on public.progress
  for each row execute function public.check_progress();

create table public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  correct int not null check (correct >= 0),
  total int not null check (total between 1 and 100),
  finished_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (correct <= total)
);

create or replace function public.stamp_finished_at()
returns trigger
language plpgsql
as $$
begin
  new.finished_at := now();
  return new;
end;
$$;

create trigger stamp_finished_at before insert on public.practice_sessions
  for each row execute function public.stamp_finished_at();

create table public.flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  flashcard_id uuid not null references public.flashcards (id) on delete cascade,
  box int not null check (box between 1 and 5),
  due_on date not null,
  reviewed_at timestamptz not null,
  added_on date not null,
  created_at timestamptz not null default now(),
  unique (user_id, flashcard_id)
);

create index on public.progress (topic_id);
create index on public.practice_sessions (user_id, finished_at);
create index on public.flashcard_reviews (user_id, due_on);
create index on public.flashcard_reviews (flashcard_id);

alter table public.progress enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.flashcard_reviews enable row level security;

create policy "progress: read own or admin" on public.progress
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "progress: insert own" on public.progress
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.topic_is_published(topic_id));
create policy "progress: update own" on public.progress
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "practice_sessions: read own or admin" on public.practice_sessions
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "practice_sessions: insert own" on public.practice_sessions
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.topic_is_published(topic_id));

create policy "flashcard_reviews: read own or admin" on public.flashcard_reviews
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- Leitner: box 1 to 5, due after 1, 2, 4, 8, 16 days. Lupa (1) sends a card
-- to box 1, Sulit (2) keeps its box, Bisa (3) moves it up one. A card the
-- learner has not reviewed yet starts in box 1 and counts toward the 20 new
-- cards a day, and only from a topic they opened in Belajar.
create or replace function public.review_flashcard(p_card uuid, p_rating int)
returns public.flashcard_reviews
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  today date := public.learner_today();
  r public.flashcard_reviews;
  next_box int;
begin
  if uid is null then
    raise exception 'Masuk untuk menyimpan progres' using errcode = '42501';
  end if;
  if p_rating not between 1 and 3 then
    raise exception 'Nilai harus 1 sampai 3' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.flashcards f
    where f.id = p_card and f.status = 'published' and public.topic_is_published(f.topic_id)
  ) then
    raise exception 'Kartu tidak ditemukan' using errcode = 'P0002';
  end if;

  select * into r from public.flashcard_reviews where user_id = uid and flashcard_id = p_card for update;

  if not found then
    if not exists (
      select 1 from public.progress p join public.flashcards f on f.topic_id = p.topic_id
      where f.id = p_card and p.user_id = uid
    ) then
      raise exception 'Buka topiknya di Belajar dulu' using errcode = 'P0001';
    end if;
    -- Serialise a learner's new cards so two tabs cannot pass 20 together.
    perform 1 from public.profiles where user_id = uid for update;
    if (select count(*) from public.flashcard_reviews where user_id = uid and added_on = today) >= 20 then
      raise exception 'Sudah 20 kartu baru hari ini, lanjut besok' using errcode = 'P0001';
    end if;
    next_box := case p_rating when 3 then 2 else 1 end;
    insert into public.flashcard_reviews (user_id, flashcard_id, box, due_on, reviewed_at, added_on)
    values (uid, p_card, next_box, today + (1 << (next_box - 1)), now(), today)
    returning * into r;
    return r;
  end if;

  next_box := case p_rating when 1 then 1 when 2 then r.box else least(r.box + 1, 5) end;
  update public.flashcard_reviews
  set box = next_box, due_on = today + (1 << (next_box - 1)), reviewed_at = now()
  where id = r.id
  returning * into r;
  return r;
end;
$$;

revoke execute on function public.review_flashcard(uuid, int) from public, anon;
grant execute on function public.review_flashcard(uuid, int) to authenticated;

-- What /flashcard shows: due cards first, then new cards from opened topics,
-- as many as today's quota of 20 still allows. box is null for a new card.
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
    where r.user_id = auth.uid() and r.due_on <= (select d from today)
  ),
  quota as (
    select greatest(0, 20 - count(*))::int as n from public.flashcard_reviews
    where user_id = auth.uid() and added_on = (select d from today)
  ),
  fresh as (
    select f.id, f.front, f.back, t.title as topic, null::int as box, p.created_at::date as sort_on, f.position
    from public.progress p
    join public.topics t on t.id = p.topic_id and t.status = 'published'
    join public.flashcards f on f.topic_id = t.id and f.status = 'published'
    where p.user_id = auth.uid()
      and not exists (select 1 from public.flashcard_reviews r where r.user_id = auth.uid() and r.flashcard_id = f.id)
    order by p.created_at, f.position
    limit (select n from quota)
  )
  select id, front, back, topic, box from (
    select * from due union all select * from fresh
  ) q
  order by box is null, sort_on, position
$$;

revoke execute on function public.flashcard_queue() from public, anon;
grant execute on function public.flashcard_queue() to authenticated;
