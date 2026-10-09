-- Content tables. Anyone reads published rows of a published parent,
-- only admins read drafts and write. exam_questions is admin only.

create type public.content_status as enum ('draft', 'published');
create type public.question_type as enum ('pilihan_ganda', 'benar_salah', 'baca_kode');

-- Stamps the author on every write. Null for the worker (service role).
create or replace function public.set_updated_by()
returns trigger
language plpgsql
as $$
begin
  new.updated_by := auth.uid();
  return new;
end;
$$;

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  description text not null default '',
  summary text not null default '',
  status public.content_status not null default 'draft',
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.slides (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  index int not null check (index >= 1),
  path text not null,
  width int not null check (width > 0),
  height int not null check (height > 0),
  status public.content_status not null default 'draft',
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (topic_id, index)
);

create table public.tips (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  body text not null,
  position int not null default 0,
  status public.content_status not null default 'draft',
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  front text not null,
  back text not null,
  position int not null default 0,
  status public.content_status not null default 'draft',
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Shared shape check for practice and exam questions.
create or replace function public.valid_question(
  q_type public.question_type, q_options text[], q_answer int, q_code text
)
returns boolean
language sql
immutable
as $$
  select coalesce(array_length(q_options, 1), 0) = case q_type when 'benar_salah' then 2 else 4 end
    and q_answer between 0 and coalesce(array_length(q_options, 1), 0) - 1
    and (q_type = 'baca_kode') = (q_code is not null)
$$;

create table public.practice_questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  type public.question_type not null,
  prompt text not null,
  code text,
  options text[] not null,
  answer int not null,
  explanation text not null,
  status public.content_status not null default 'draft',
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (public.valid_question(type, options, answer, code))
);

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null unique references public.topics (id) on delete cascade,
  duration_minutes int not null default 30 check (duration_minutes between 1 and 180),
  max_attempts int not null default 3 check (max_attempts between 1 and 10),
  pass_score int not null default 70 check (pass_score between 1 and 100),
  question_count int not null default 20 check (question_count between 1 and 100),
  status public.content_status not null default 'draft',
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams (id) on delete cascade,
  type public.question_type not null,
  prompt text not null,
  code text,
  options text[] not null,
  answer int not null,
  explanation text not null,
  status public.content_status not null default 'draft',
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (public.valid_question(type, options, answer, code))
);

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  description text not null default '',
  status public.content_status not null default 'draft',
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.track_nodes (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  optional boolean not null default false,
  position int not null default 0,
  status public.content_status not null default 'draft',
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (track_id, topic_id)
);

-- Cycle and same-track checks come with the roadmap editor (phase 5).
create table public.track_edges (
  id uuid primary key default gen_random_uuid(),
  from_node_id uuid not null references public.track_nodes (id) on delete cascade,
  to_node_id uuid not null references public.track_nodes (id) on delete cascade,
  status public.content_status not null default 'draft',
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (from_node_id, to_node_id),
  check (from_node_id <> to_node_id)
);

create index on public.slides (topic_id);
create index on public.tips (topic_id);
create index on public.flashcards (topic_id);
create index on public.practice_questions (topic_id);
create index on public.exam_questions (exam_id);
create index on public.track_nodes (track_id);
create index on public.track_nodes (topic_id);
create index on public.track_edges (to_node_id);

-- Visibility helpers. security definer so a child policy can look at its
-- parent without stacking the parent's RLS on top.
create or replace function public.topic_is_published(t uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.topics where id = t and status = 'published')
$$;

create or replace function public.track_is_published(t uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.tracks where id = t and status = 'published')
$$;

create or replace function public.node_is_published(n uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.track_nodes tn
    join public.tracks tr on tr.id = tn.track_id
    join public.topics tp on tp.id = tn.topic_id
    where tn.id = n and tn.status = 'published'
      and tr.status = 'published' and tp.status = 'published'
  )
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'topics', 'slides', 'tips', 'flashcards', 'practice_questions',
    'exams', 'exam_questions', 'tracks', 'track_nodes', 'track_edges'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create trigger set_updated_by before insert or update on public.%I
         for each row execute function public.set_updated_by()', t);
    execute format(
      'create policy "%s: admin all" on public.%I for all to authenticated
         using ((select public.is_admin())) with check ((select public.is_admin()))', t, t);
  end loop;
end;
$$;

create policy "topics: read published" on public.topics
  for select to anon, authenticated
  using (status = 'published');

create policy "tracks: read published" on public.tracks
  for select to anon, authenticated
  using (status = 'published');

create policy "slides: read published" on public.slides
  for select to anon, authenticated
  using (status = 'published' and public.topic_is_published(topic_id));

create policy "tips: read published" on public.tips
  for select to anon, authenticated
  using (status = 'published' and public.topic_is_published(topic_id));

create policy "flashcards: read published" on public.flashcards
  for select to anon, authenticated
  using (status = 'published' and public.topic_is_published(topic_id));

create policy "practice_questions: read published" on public.practice_questions
  for select to anon, authenticated
  using (status = 'published' and public.topic_is_published(topic_id));

create policy "exams: read published" on public.exams
  for select to anon, authenticated
  using (status = 'published' and public.topic_is_published(topic_id));

create policy "track_nodes: read published" on public.track_nodes
  for select to anon, authenticated
  using (public.node_is_published(id));

create policy "track_edges: read published" on public.track_edges
  for select to anon, authenticated
  using (
    status = 'published'
    and public.node_is_published(from_node_id)
    and public.node_is_published(to_node_id)
  );

-- exam_questions: no read policy besides admin. Learners reach it only
-- through the exam functions (phase 7).

-- Storage. imports: private, admin upload, max 50 MB pptx.
-- slides: public read by URL, written only by the worker (service role).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('imports', 'imports', false, 52428800,
   array['application/vnd.openxmlformats-officedocument.presentationml.presentation']),
  ('slides', 'slides', true, 5242880, array['image/avif']);

create policy "imports: admin upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'imports' and (select public.is_admin()));

create policy "imports: admin read" on storage.objects
  for select to authenticated
  using (bucket_id = 'imports' and (select public.is_admin()));
