-- Personal notes and bookmarks per chapter: one row per learner and chapter.
create table public.chapter_notes (
  user_id uuid not null references auth.users (id) on delete cascade,
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  note text not null default '' check (char_length(note) <= 4000),
  bookmarked boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, chapter_id),
  check (note <> '' or bookmarked)
);

create index on public.chapter_notes (user_id, updated_at desc);
create index on public.chapter_notes (chapter_id);

alter table public.chapter_notes enable row level security;

create policy "chapter_notes: own" on public.chapter_notes
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.chapter_notes from anon, authenticated;
grant select, insert, update, delete on public.chapter_notes to authenticated;

-- A learner can ask a question about a chapter: it lands in the same inbox as
-- reports, and the admin's "selesai" mails the answer's author back.
alter table public.chapter_reports drop constraint chapter_reports_kind_check;
alter table public.chapter_reports add constraint chapter_reports_kind_check
  check (kind in ('salah', 'tidak-jelas', 'lainnya', 'pertanyaan'));
