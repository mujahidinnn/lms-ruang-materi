# Chapters: topics become courses with readable lessons

Sub-project 1 of 3 toward a Dicoding/Coursera-style learning experience.
Sub-project 2 (code practice in the browser) and 3 (final project and
certificate) get their own specs later. Discussion is out of scope.

## Intent

Today a topic is a slide deck plus summary, tips, practice, flashcards and an
exam. Learners mostly flip slides. The owner wants learning that reads like a
course: a syllabus of chapters, each a proper lesson with explanation, code
examples and a short check, with progress per chapter.

Agreed with the owner (2026-10-11):

- Topic stays the unit (approach A): a topic becomes a course made of
  chapters. Slides stay and are embedded in chapters; practice, flashcards
  and the exam stay at topic level as the closing exercise and final exam.
- Chapter content comes from both sources: the import worker drafts chapters
  from the deck with AI, and admins can write, edit, add, delete and reorder
  chapters in /admin.
- Chapters are open in any order. The suggested order and progress are shown;
  nothing is locked (same rule as roadmap prerequisites).

Success: every published topic shows a syllabus; a learner can read chapter
by chapter, answer each chapter's quiz, see "3 dari 6 bab selesai", and
resume at the last chapter from Dasbor. Topics without chapters keep working
as they do now.

## Data model

New tables, all following the existing content pattern (`status`
`content_status` draft/published/archived, `updated_by`, RLS: public read of
published rows of published topics, admin all; `publish_topic` swaps drafts
in).

| Table | Columns | Notes |
| --- | --- | --- |
| `chapters` | `id`, `topic_id` (fk cascade), `position` int, `slug` kebab, `title`, `body` markdown, `slide_from` int null, `slide_to` int null, `est_minutes` int (1-60), `status`, `updated_by`, timestamps | unique `(topic_id, status, position)` and `(topic_id, status, slug)`; check `slide_from <= slide_to` |
| `chapter_questions` | `id`, `chapter_id` (fk cascade), `position`, same shape as `practice_questions` (`type`, `prompt`, `code`, `options`, `answer`, `explanation`), `status`, `updated_by` | `valid_question` check; 2-4 per chapter |
| `chapter_progress` | `user_id` (fk cascade), `chapter_id` (fk cascade), `completed_at` | pk `(user_id, chapter_id)`; learners read own, admins read all; written only by `complete_chapter()` |

Functions and rules:

- `complete_chapter(p_chapter uuid)`: security invoker or definer with
  `search_path = ''`; requires a signed-in caller, the chapter published in a
  published topic, and guardian consent (`require_consent` trigger on
  `chapter_progress` insert). Idempotent (on conflict do nothing). Also calls
  `touch_progress(topic, null, null)` so the topic becomes `sedang`.
- When every published chapter of a topic without a published exam is
  complete, the topic's progress becomes `selesai` (trigger on
  `chapter_progress`, security definer; topics with an exam still finish
  only by passing it).
- `progress` gains `last_chapter_id` (nullable fk set null) so Dasbor can
  resume at a chapter; `touch_progress` gets an optional `p_chapter`.
- `publish_topic` publishes chapters and chapter questions like the other
  tables. Chapter progress follows a republished chapter by slug: before a
  published chapter is deleted, `chapter_progress` rows move to the draft
  chapter with the same slug (same idea as `carry_flashcard_reviews`).
- Indexes on every fk; read policies use `topic_id in (select id from
  topics where status = 'published')`, not a per-row function.

## Content: markdown and slide embeds

- `body` is GitHub-flavoured markdown. Raw HTML is not rendered (AI and
  admin text are both untrusted): `react-markdown` + `remark-gfm`, no
  `rehype-raw`.
- Code blocks are highlighted on the server with `shiki` (light theme
  matching the canvas, dark theme for dark mode) and get a copy button.
- `![keterangan](slide:12)` embeds slide 12 of the topic: a custom image
  renderer resolves it to the slide's 1600px variant with the slide's
  width/height, rounded, click to enlarge. Unknown slide numbers render
  nothing. A pure helper `resolveSlideRef(src, slides)` is unit tested.
- Chapter pages are public and cached (`'use cache'`, `cacheTag('content')`),
  like Belajar today; per-learner state loads in a client component.

## AI drafting (worker)

- `draftSchema` gains `chapters`: 4-8 items of `{ slug, title, est_minutes,
  slide_from, slide_to, body, quiz: 2-4 questions }`. `body` 400-800 words,
  Indonesian, explanation in the learner's voice with at least one code
  example where the topic is code, and 1-3 `slide:N` embeds within the
  chapter's range.
- `repairDraft` extends to chapters: clamp slide ranges to the deck, drop
  invalid quiz questions, keep chapters that still have at least 2 questions;
  the 4-chapter minimum still applies.
- The prompt asks for chapters that follow the deck's order and together
  cover the whole deck.
- Re-importing the 13 existing topics is needed to get chapters (10 imports
  per 24h, so two days). Existing exam attempts are safe (archived
  questions) and flashcard reviews carry over.

## Admin

- `/admin/topik/[slug]` gets a "Bab" section above Slide: a list of chapters
  (drafts when there are drafts, else published, like the other sections)
  with up/down reorder, add, delete, and an editor per chapter: title, slug,
  minutes, slide range, markdown body with a preview tab (same renderer as
  the public page), and the chapter's quiz using `QuestionEditor`.
- Server actions validate with zod and reuse `requireAdmin` and
  `updateTag('content')`.

## Learner UI (pastel style, GUIDELINE "Style")

- `/belajar/[slug]` becomes the course page when the topic has published
  chapters:
  - header: title, description, chips (bab count, total minutes, slide
    count), primary pill "Mulai bab 1" or "Lanjutkan: <bab>".
  - syllabus: numbered chapter tiles (title, minutes, state icon), progress
    bar "x dari y bab selesai".
  - below: cards for Latihan akhir, Flashcard, Ujian akhir and "Lihat semua
    slide".
  - without chapters: today's page (viewer, summary, tips) unchanged.
- `/belajar/[slug]/slide`: the full slide viewer (today's viewer moved).
- `/belajar/[slug]/[bab]`: chapter page.
  - desktop: sticky syllabus on the left; phone: "Daftar bab" button opening
    a bottom sheet.
  - reading column ~70ch, 17px body, bold headings, embedded slides, code
    blocks.
  - chapter quiz at the end, same look as practice (white option cards with
    pastel numbers, mint correct, pink wrong); all correct calls
    `complete_chapter` (signed in) and shows "Bab selesai".
  - bottom nav: previous / next chapter; on the last chapter "Lanjut ke
    latihan akhir".
  - opening a chapter records `last_chapter_id` for signed-in learners.
- Guests can read every chapter and answer quizzes; nothing is saved and a
  "Masuk untuk menyimpan progres" hint appears once, like practice.
- Dasbor "Lanjutkan belajar" links to the last chapter when there is one.
- SEO: chapter pages get title/description/canonical and join the sitemap.

## Testing

- `supabase/tests/security_smoke.sql`: drafts invisible to anon, published
  chapters readable, `chapter_progress` own-only and not writable directly,
  `complete_chapter` refuses unpublished chapters and missing consent,
  topic without exam becomes `selesai` when all chapters are done, progress
  carries across republish by slug.
- Vitest: `resolveSlideRef`, chapter completion rule, extended
  `repairDraft`/`draftSchema` cases.
- Playwright e2e (guest): course page lists chapters, open a chapter, answer
  its quiz, move to the next chapter.
- Visual check of course and chapter pages on desktop and phone with
  playwright-cli, light and dark.

## Out of scope here

Code playground and auto-graded coding tasks (sub-project 2), final projects
and certificates (sub-project 3), discussion, video lessons, chapter-level
gating.
