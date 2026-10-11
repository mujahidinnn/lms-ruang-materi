-- Chapters: a topic is a course of readable lessons. Same draft/publish
-- pattern as the other content tables; chapter_questions follow their
-- chapter's status. Learner state lives in chapter_progress and
-- progress.last_chapter_id, written only by functions (next migration).

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  position int not null check (position >= 0),
  slug text not null check (slug ~ '^[a-z0-9-]+$' and slug <> 'slide'),
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '',
  slide_from int check (slide_from >= 1),
  slide_to int check (slide_to >= 1),
  est_minutes int not null default 10 check (est_minutes between 1 and 60),
  status public.content_status not null default 'draft',
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (slide_from is null or slide_to is null or slide_from <= slide_to),
  -- Deferred so reordering can swap two positions in one transaction.
  unique (topic_id, status, position) deferrable initially deferred,
  unique (topic_id, status, slug) deferrable initially deferred
);

create table public.chapter_questions (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  position int not null default 0,
  type public.question_type not null,
  prompt text not null,
  code text,
  options text[] not null,
  answer int not null,
  explanation text not null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (public.valid_question(type, options, answer, code))
);

create table public.chapter_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, chapter_id)
);

alter table public.progress add column last_chapter_id uuid references public.chapters (id) on delete set null;

create index on public.chapter_questions (chapter_id);
create index on public.chapter_progress (chapter_id);
create index on public.progress (last_chapter_id) where last_chapter_id is not null;
create index on public.chapters (updated_by) where updated_by is not null;
create index on public.chapter_questions (updated_by) where updated_by is not null;

alter table public.chapters enable row level security;
alter table public.chapter_questions enable row level security;
alter table public.chapter_progress enable row level security;

create trigger set_updated_by before insert or update on public.chapters
  for each row execute function public.set_updated_by();
create trigger set_updated_by before insert or update on public.chapter_questions
  for each row execute function public.set_updated_by();

create policy "chapters: admin all" on public.chapters for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "chapter_questions: admin all" on public.chapter_questions for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- IN subqueries are planned once; they run under the caller's RLS on
-- topics, which already hides unpublished topics from anon and learners.
create policy "chapters: read published" on public.chapters for select to anon, authenticated
  using (status = 'published' and topic_id in (select id from public.topics where status = 'published'));
create policy "chapter_questions: read published" on public.chapter_questions for select to anon, authenticated
  using (chapter_id in (
    select c.id from public.chapters c join public.topics t on t.id = c.topic_id
    where c.status = 'published' and t.status = 'published'));

create policy "chapter_progress: read own or admin" on public.chapter_progress for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- No learner insert/update/delete policy on chapter_progress: only
-- complete_chapter() (security definer) writes it.
create trigger require_consent before insert on public.chapter_progress
  for each row execute function public.require_consent();
