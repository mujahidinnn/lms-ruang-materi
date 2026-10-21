# Kelas ala Dicoding: materi dulu, slide pendukung

Date: 2026-10-21. Status: approved to build (owner handed the decisions to Claude).

## Why

The owner says the learning flow is rigid: it is "just slides", while slides
are only one way to learn. They want the flow of a Dicoding class and asked
Claude to research it.

What the data shows (production, 2026-10-21):

- 8 of 13 published topics have no chapters at all, so a learner only gets
  the slide viewer (git, github, git-dan-github, html5, html5-dan-css3,
  html-css-javascript, javascript, reactjs). html-css-javascript has no
  practice, flashcards or exam either.
- The 5 topics with chapters average about 300 words per chapter, with 2 to 4
  slide images embedded in each. Reading a chapter still feels like reading
  slides.
- The whole site has 1 code exercise.
- There is no final project and no certificate.

Root cause of the thin chapters: `worker/prompt.ts` asks one model call for
everything (summary, tips, 15-30 flashcards, practice, 40 exam questions and
4-8 chapters of 400-800 words). The output budget runs out and chapters come
back short; exercises that fail their own checks are dropped, which is why
almost none survive.

What a Dicoding class looks like (research, "Belajar Dasar Pemrograman
JavaScript", dicoding.com/academies/256): 13 modules over 46 hours. Each
module has 5-12 text articles, a summary ("Rangkuman"), one quiz or exam, and
in most modules an interactive code unit plus a 45-minute coding quiz. The
class ends with a final exam, then a submission project of about 10 hours
reviewed by a reviewer, then a competency certificate with a verification
link. Every module shows its time estimate.

## Goal

Every topic is a class you can learn from without opening a slide:

1. Each chapter reads like a tutorial: goal, step-by-step explanation,
   worked code, try-it-yourself, summary, quiz.
2. The class has a visible path: chapters, then practice, exam-prep, final
   exam, final project, certificate, with progress at each step.
3. Slides stay available as supporting material, not the lesson.

Success: a learner can finish any of the 13 topics (and Express.js) using
only chapters, exercises and quizzes, and gets a certificate they can share.

## Non-goals

- Human reviewers, a discussion forum, mentoring, an AI chat tutor. Each
  needs moderation or staff, and the users include minors (GUIDELINE,
  Privacy).
- Video lessons, payments, enrolment.
- Splitting a chapter into several pages. One chapter stays one page with a
  table of contents; Dicoding's articles map to sections inside it.

## Anti-goals

- Longer chapters that are padding or invented facts. Facts must still come
  from the deck (the current rule); depth comes from explanation, examples
  and practice.
- Locking learners out. Order is shown and recommended; only the
  certificate has requirements. The final exam stays open, so "Sudah paham?
  Langsung ujian" on the roadmap and leveling by exam keep working.
- Breaking what exists: current progress, exam attempts, badges, the
  chapter rule (`complete_chapter`), the e2e tests.

## Design

### 1. Deeper chapters (worker)

Two stages instead of one call:

- **Stage 1, the class**: one call returns what it returns now (title,
  description, summary, tips, flashcards, practice, exam questions,
  prerequisites) plus a chapter *outline*: slug, title, slide range, 2-4
  learning goals, whether it is a practice chapter, and which code kind fits
  (web, js, express, or none).
- **Stage 2, each chapter**: one call per chapter, with the deck and that
  chapter's outline. It returns:
  - body markdown of 900 to 1500 words, in this order: `## Tujuan` (the
    goals), explanation in short `##`/`###` sections, at least one worked
    code example when the deck has code, `## Rangkuman` (3-6 bullets);
  - 0 or 1 slide embed, only for a diagram that text cannot replace;
  - 3 to 5 quiz questions;
  - for a practice chapter, 1 or 2 code exercises.
- If a chapter call fails or does not validate, retry it once; if it fails
  again, keep the class without that chapter (the 4-chapter minimum still
  applies, else the job fails as today).
- Exercises still run against their own checks (`validateExercises`). On a
  failure, stage 2 is asked once to fix that exercise, with the failing check
  names, before it is dropped.
- Topics where code runs in this build (HTML/CSS/JS, JavaScript, React has
  none yet, Node/Express): at least half of the chapters are practice
  chapters.

Quota: a deck now costs 1 + n calls (n = 4-8 chapters). The Gemini free tier
allows 20 requests per model per day, so plan about two decks per model per
day across the allowed models (`lib/llm.ts`). The import limit (10 jobs a
day) stays.

### 2. The class path (pages)

- **Course page** (`/belajar/[slug]`): the syllabus lists each chapter with
  its minutes and its parts (Materi, Kode when it has exercises, Kuis) and a
  done mark. Under the chapters, the closing steps in order: Latihan soal,
  Simulasi ujian, Ujian akhir, Proyek akhir (when the topic has one),
  Sertifikat. Each shows its state: belum, sedang, selesai, or what it still
  needs ("selesaikan 3 bab lagi"). Slides, flashcards and tips move to a
  "Bahan pendukung" block.
- **Chapter page**: the table of contents follows the `##` headings; the
  end of the page is a short checklist for this chapter (baca, kode, kuis)
  and the next step. The existing next-chapter logic stays.
- **Topics without chapters** keep the current slide page until they are
  re-imported; no new behaviour for them.

### 3. Final exam stays open

The exam is not gated (test-out and levels depend on it). The class page
shows it after the chapters as the recommended order; the certificate is
what requires the full path.

### 4. Final project

- One project per topic, only for topics whose code kind runs here (web, js,
  express). Stored like a code exercise but owned by the topic, not a
  chapter: a larger brief, starter, solution, and 5-12 checks.
- Drafted by the worker in stage 1 (brief) and validated like exercises;
  edited and tested in `/admin/topik/[slug]` with the existing "Uji solusi".
- A `web` project cannot be checked in the worker (no DOM there), so a
  project carries a "verified" mark set when its solution passes "Uji solusi"
  in admin (or the worker check for js/express). `publish_topic` refuses a
  topic whose project is not verified, so a broken project never blocks
  learners.
- A learner passes it in the browser sandbox like an exercise; the pass is
  saved server-side the same way `code_progress` is.

### 5. Certificate

- Eligible when the learner has done every published chapter, passed the
  final exam, and passed the project when the topic has one. Topics without
  chapters: exam (and project) only.
- Opt-in, because the page shows the learner's name publicly and some
  learners are minors (GUIDELINE, Privacy): when eligible, the class page
  shows "Terbitkan sertifikat"; pressing it (an RPC that re-checks
  eligibility in SQL) creates the certificate. It needs a display name; the
  button sends the learner to Profil first when the name is empty. The
  name is copied onto the certificate at issue time.
- Eligibility is computed when asked, not by triggers, so learners who
  passed before this ships qualify too (no backfill), and a project added
  later does not take away a certificate already issued.
- One per learner per topic. `/sertifikat/[kode]`: public, printable (print
  CSS, A4 landscape), name, class, date, verification code. Not indexed. The
  learner can delete it; deleting the account removes it.
- Listed in `/nilai` and on the class page.

### 6. Content rollout

- Re-import in this order: the 8 topics without chapters, then Express.js
  (already queued as an import on 2026-10-21), then the 5 thin ones.
- Publishing stays a human step in `/admin/topik`; Claude may publish only
  when the owner asks.

### 7. Progress across re-imports

- Stage 1 gets the topic's current chapter slugs and titles and reuses a
  slug when a new chapter covers the same part of the deck, so
  `carry_chapter_progress` keeps chapter progress (it matches by slug).
- `code_progress` for exercises that disappear is lost, as today. Chapter
  done marks survive through the carry above.

### 8. Length targets are guidance

900-1500 words, worked examples, at most 1 embed, half practice chapters:
in the prompt, not schema minimums. The schema keeps a floor (body at least
2500 characters) so a near-empty chapter is retried once and then dropped;
a short deck yields shorter, honest chapters. Chapter count: 4 to 12
(Express.js drew more than 8 from 56 slides and failed on 2026-10-21).

## Constraints

- Astro 7 + React islands, Supabase with RLS, worker in GitHub Actions
  (GUIDELINE). No new services.
- Database rules live in the database (GUIDELINE): the exam requirement and
  certificate issuing are SQL functions with pgTAP tests.
- Re-importing a topic replaces its chapters; the hand-written Express
  exercise the e2e depends on (nodejs, "Route daftar dan detail produk")
  must be re-added or the e2e retargeted.

## Decided by Claude (owner handed these over)

- Chapter = one page with sections, not several pages.
- Order is recommended, not enforced; the exam stays open, only the
  certificate needs the full path.
- Certificate is opt-in ("Terbitkan sertifikat"), computed on request, no
  backfill needed.
- Worker reuses existing chapter slugs on re-import.
- A project must be verified before the topic can be published.
- Length targets are prompt guidance with a low floor; 4 to 12 chapters.
- No human review; the final project is auto-checked.
- Slides become supporting material.

## Left to the builder

- Exact schema for projects and certificates, function names, the
  verification code format.
- The visual design of the path and certificate (through the frontend-design
  pass and screenshots, per the owner's standing rule).
- How stage 2 is batched if the quota is too tight.
