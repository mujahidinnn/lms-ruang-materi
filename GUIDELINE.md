# Code Guideline

How code is organised here and where to put new code. What the app does and
how to run it live in `README.md`.

Ruang Materi is growing from a slide viewer into a full LMS. This file
describes the target product. The Features table marks what is built and
what is planned; build planned parts to these rules instead of extending the
old single-page layout.

## AI Agent Rules

- **No AI slop design**: no generic, bloated or repetitive UI. Minimal, tailored Tailwind components over copy-pasted UI kits.
- **No AI writer tone**: commits, PRs, comments and docs in plain human tone. No em-dashes, no fluff, no robotic transitions.
- **Token efficiency**: minimal diffs, never rewrite unchanged files. YAGNI. Reuse existing helpers before writing new ones.
- **Next.js 16**: APIs differ from older versions. Check `node_modules/next/dist/docs/` before using a Next API (see `AGENTS.md`). Middleware is now `proxy.ts`.
- **Follow the Build Order**: one phase per change, end to end (route, data, RLS, test), before starting the next.

## Product and UX Flow

The learning loop, every feature hangs off it:

```
Roadmap -> Topik -> Belajar -> Latihan -> Ujian -> Nilai
   ^                    |          |                  |
   |                    +--- Flashcard (alongside, ---+
   |                         never a gate)            |
   +---------------- node marked selesai -------------+
```

- **Roadmap** (like roadmap.sh): a track is a graph of topic nodes with
  prerequisites. Each node shows its state: `belum`, `sedang`, `selesai`,
  `dilewati`. Clicking a node opens a side panel with the summary and links
  to Belajar, Latihan, Flashcard and Ujian for that topic.
  - Prerequisites are advice, never locks. A node with open prerequisites
    shows "Disarankan setelah X".
  - Every node offers "Sudah paham? Langsung ujian".
- **Belajar**: the slide viewer plus a short text summary and the topic's
  tips. Ends with one call to action: "Mulai latihan".
- **Latihan**: practice questions, untimed, unlimited tries, instant feedback
  with an explanation per answer. Not graded. A finished set shows "x dari y
  benar", then a primary "Coba ujian" button and a secondary "Ulangi yang
  salah" link. Signed-in learners get a `practice_sessions` row (counts
  toward the streak only).
- **Flashcard**: Leitner boxes 1 to 5, due after 1, 2, 4, 8 and 16 days.
  Three ratings: 1 Lupa sends the card to box 1, 2 Sulit keeps its box,
  3 Bisa moves it up one (max 5).
  - Cards join a learner's schedule only after they open that topic in
    Belajar, at most 20 new cards a day.
  - Due cards across topics in `/flashcard`, one topic's deck in
    `/flashcard/[slug]`.
  - Logged-out learners can flip `/flashcard/[slug]` without scheduling.
- **Ujian**: timed, graded on the server, limited attempts. No feedback until
  submit. Passing (default 70) marks the roadmap node `selesai`.
  - Each attempt draws `question_count` questions at random from a bank of at
    least twice that size.
  - The review shows the score and the explanation per question. Correct
    options are shown only after a pass or after the last attempt.
  - After the last attempt fails, a new set of `max_attempts` opens 24 hours
    later.
  - A failed result says "Belum lulus" and links to the topics to review,
    never "Gagal".
- **Tips**: short practical notes per topic, shown inside Belajar.
- **Nilai**: the learner's report, best score per exam, attempts, roadmap
  completion per track.
- **Dasbor**: the signed-in home. "Lanjutkan belajar" (the topic with the
  latest `progress.updated_at`), due flashcards, open exams, track progress,
  level and streak.
  - "Ujian terbuka" lists only unpassed exams for topics marked `sedang`.
    Remaining attempts are shown only on the exam intro page.
  - With no progress yet, Dasbor shows one action: "Pilih track pertama".
- **Leveling**: one level per track, earned only by passing exams, so a level
  says what the learner can actually do.

  ```
  Pemula     0-25%    of the track's core topics passed
  Dasar      26-50%
  Menengah   51-80%
  Mahir      81-100%
  ```

  - **Streak**: consecutive days with any learning activity (a flashcard
    review, a finished latihan set or an exam submit), in the learner's
    timezone (`profiles.timezone`, default `Asia/Jakarta`).
    - A broken streak shows "Mulai lagi hari ini" with no loss message.
    - The best streak is kept and shown in Nilai.
  - **Lencana**: one per track, granted when every core (non-optional) node
    is passed. Shown in Nilai only; a public share page is deferred.
  - **Not used, on purpose**: XP from latihan (unlimited tries, farmable),
    global leaderboards (invite cheating, discourage beginners), any level or
    streak sent from the browser.

Access: all learning content (roadmap, belajar, latihan, flashcard decks) is
public and readable without login. Login is needed to save progress, review
flashcards on a schedule, take exams and see Nilai.
- Show "Masuk untuk menyimpan progres" once, after the first finished latihan
  set, not on every page. Never block a public page.
- The landing page sends signed-in users to `/dasbor`.

## Question Types

Version 1 grades automatically only, so every question has one correct
answer:

- **Pilihan ganda**: 4 options, one correct, options shuffled per attempt.
- **Benar / salah**: two options.
- **Baca kode**: a code block (`font-mono`, `<pre><code>`) plus 4 options,
  e.g. "apa output kode ini?".

Each question stores `prompt`, `options[]`, `answer` (option index),
`explanation`, and `code` (required for baca kode, empty otherwise) (shown in latihan and after an exam). No free text, no
multiple correct answers, no file uploads.

## Out of Scope

Do not build these, even partly, unless this section changes first:

- Payments, paid courses, subscriptions
- Native mobile apps (the site is a PWA instead, see PWA)
- Mentor or teacher roles, classes, cohorts, assignments
- Forums, comments, chat between learners
- Email or push notifications, reminders
- Free-text or manually graded questions
- Certificates beyond lencana
- Multi-language UI (Bahasa Indonesia only)

**Deferred after v1** (designed, not built yet):

- Public lencana page `/lencana/[id]` with its own OG card, and the
  `public_badges` opt-in
- A separate `/tips` index page (tips live inside Belajar for now)

## UX Rules

- **One primary action per screen**, in the accent color. Everything else is
  a secondary zinc button or a link.
- **Progress is always visible**: roadmap node states, a progress bar per
  track, "3 dari 12 topik selesai". Never rely on color alone, pair it with an
  icon or text.
- **Mobile first.** The roadmap graph collapses to an ordered list with the
  same states under `sm`. Side panels become bottom sheets. Touch targets are
  at least 44px.
- **Keyboard**: flashcards flip on Space and rate on 1 to 3; quiz options
  select on 1 to 4 and submit on Enter. Visible focus rings on everything.
- **Screen readers**: the ordered list is the accessible roadmap at every
  size; the graph is `aria-hidden`.
- **Feedback**: latihan results and form errors go in an `aria-live` region.
  The exam timer shows text, not just a bar, and warns at 5 minutes and 1
  minute. Its `aria-live` region announces only those two warnings, never
  every second.
- **Exams never lose work**: answers autosave to `localStorage` keyed by
  attempt id, and leaving the page asks for confirmation.
- **Empty states** say what to do next ("Belum ada kartu jatuh tempo. Buka
  roadmap untuk mulai topik baru.").
- **Copy** is Bahasa Indonesia, short, second person ("kamu"), no exclamation
  marks.

## Screen Sketches

Layout intent, not pixel specs. `[ ]` is a button, `(*)` the primary action.

**Roadmap** (`/roadmap/[track]`, desktop: graph + side panel)

```
+-------------------------------------------+---------------------+
| Frontend Dasar            5 dari 12  ===--|  HTML5              |
|                                           |  selesai            |
|   [x HTML5] --> [x CSS3] --> [~ JS] ---+  |                     |
|                                |       |  |  Ringkasan 2 baris  |
|                         [  DOM ]  [ Fetch]|                     |
|                              \     /      |  (*) Belajar        |
|                             [ React ]    |  [ ] Latihan        |
|                                           |  [ ] Flashcard      |
| x selesai  ~ sedang  . belum  - dilewati  |  [ ] Ujian  86      |
+-------------------------------------------+---------------------+
```

Mobile: the same nodes as an ordered list, panel opens as a bottom sheet.

```
+-------------------------+
| Frontend Dasar   5/12   |
| ====------------------  |
| x HTML5            86 > |
| x CSS3             74 > |
| ~ JavaScript          > |
| . DOM      disarankan > |
+-------------------------+
```

**Belajar** (`/belajar/[slug]`)

```
+--------------------------------------------------+
| < Roadmap   JavaScript               3 / 24      |
| +----------------------------------------------+ |
| |                  slide                       | |
| +----------------------------------------------+ |
| [thumb][thumb][thumb][thumb] ...                 |
| Ringkasan                 | Tips                 |
| paragraf pendek           | - pakai const        |
|                           | - hindari ==         |
|                       (*) Mulai latihan          |
+--------------------------------------------------+
```

**Latihan** (instant feedback) vs **Ujian** (no feedback until submit)

```
Latihan  soal 2 dari 10                 Ujian   soal 2 dari 20   12:41
---------------------------------       ---------------------------------
Apa hasil typeof null?                  Apa hasil typeof null?
 1 "null"                                1 "null"
 2 "object"   <- benar                   2 "object"   (dipilih)
 3 "undefined"                           3 "undefined"
 Pembahasan: bug lama di JS ...          [ ] Ragu-ragu
(*) Soal berikutnya                     [ ] Sebelumnya   (*) Berikutnya
```

**Flashcard** (`Space` balik, `1`-`3` nilai)

```
+------------------------------+
|        Event loop            |
|                              |
|      [ Space: balik ]        |
+------------------------------+
 1 Lupa   2 Sulit   3 Bisa          7 kartu tersisa
```

**Dasbor** (`/dasbor`)

```
+--------------------------------------------------+
| Lanjutkan belajar                    Streak 6 hari|
| JavaScript, slide 3 dari 24   (*) Lanjutkan      |
+------------------------+-------------------------+
| 7 kartu jatuh tempo    | Ujian terbuka           |
| [ ] Mulai review       | JavaScript, belum lulus |
+------------------------+-------------------------+
| Frontend Dasar  Dasar    ====-------  5/12       |
| Backend Node    Pemula   =----------  1/9        |
+--------------------------------------------------+
```

**Nilai** (`/nilai`)

```
+--------------------------------------------------+
| Frontend Dasar                Dasar -> Menengah  |
| =========-------------        butuh 2 topik lagi |
|--------------------------------------------------|
| Topik        Nilai terbaik  Percobaan  Status    |
| HTML5        86             1 / 3      lulus     |
| CSS3         74             2 / 3      lulus     |
| JavaScript   58             1 / 3      belum     |
|--------------------------------------------------|
| Lencana: [Git Dasar] [ ? ]     Streak terbaik 14 |
+--------------------------------------------------+
```

**Admin impor** (`/admin/impor`)

```
+--------------------------------------------------+
| Impor materi                                     |
| [ pilih .pptx ]  Model: [ Claude opus-5-5 v ]    |
|                               (*) Mulai impor    |
|--------------------------------------------------|
| SQL.pptx        drafting...   claude   1 mnt     |
| VueJS.pptx      selesai       gemini   [Tinjau]  |
| Node-JS.pptx    gagal: output tidak valid [Ulang]|
+--------------------------------------------------+
```

## Illustrations

Use them where a screen would otherwise feel empty or where they explain
something: landing hero, empty states (no due cards, no exams yet), exam
result (lulus / belum lulus), login page, 404. Not on every card.

- Inline SVG components in `components/illustrations/`, same visual language
  as the logo (`components/brand/Logo.tsx`): simple shapes, `rounded`
  corners, thick round strokes, no gradients or people, no stock or
  AI-generated images.
- Colors only through classes (`fill-zinc-800/60`, `fill-accent`,
  `stroke-accent/40`) so they flip with light and dark. No hex in SVG.
- `role="img"` with an Indonesian `aria-label`, or `aria-hidden` when the
  text next to it already says the same.
- Keep each under about 2 KB and 60 lines; no illustration library.

## Layout

```
app/
  page.tsx               landing: tracks, featured topics
  roadmap/               track list, roadmap/[track] graph
  belajar/[slug]/        slide viewer + summary + tips
  latihan/[slug]/        practice quiz
  flashcard/             due review, flashcard/[slug] one topic
  ujian/[slug]/          exam intro, attempt, result
  nilai/                 learner report, levels, lencana (auth)
  dasbor/                signed-in home (auth)
  masuk/                 login (magic link or password), magic link callback
  profil/                account settings (auth)
  template/              portfolio template gallery
  privasi/               privacy page (UU PDP)
  manifest.ts            PWA manifest
  admin/                 content management (admin role)
    impor/               upload pptx, start and watch import jobs
    topik/[slug]/        review and edit drafts, publish
    roadmap/             edit tracks and node prerequisites
    ujian/               exam bank, answer keys
components/
  <feature>/             one folder per feature: roadmap/, quiz/, flashcard/, admin/ ...
  illustrations/         inline SVG illustrations (see Illustrations)
  ui/                    shared primitives used by 2+ features
data/
  templates.ts           portfolio template list (static, stays in git)
lib/                     pure helpers, no React
  content.ts             cached reads of published content ('use cache' + cacheTag), async only
  slides.ts              thumbSrc, coverSrc: pure, sync, safe in client components
  roadmap.ts             node state from progress, unlocking by prerequisites
  leitner.ts             next box and due date for a rating
  site.ts                site name, URL, description, OG image
  supabase/              the only Supabase entry points:
    public.ts            cookie-less anon client, used only by lib/content.ts
    server.ts            cookie client (@supabase/ssr), for dal.ts and Server Actions
    client.ts            browser client for per-user client components
  dal.ts                 server-only data access, checks the user first
proxy.ts                 refreshes the Supabase session cookie, nothing else
worker/
  import-deck.ts         pptx -> slides + AI draft, runs in GitHub Actions only
  prompt.ts              system prompt and the zod schema for drafts
  llm/                   one file per provider: anthropic.ts, openai.ts, gemini.ts ...
.github/workflows/
  import-deck.yml        workflow_dispatch, triggered from /admin/impor
supabase/
  migrations/            schema, RLS policies, functions
  tests/security_smoke.sql
public/                  templates/, template-previews/, icons/, sw.js, offline.html
scripts/                 one-off: migrate the 13 existing decks to Storage + DB
```

## Features

| Feature | Route | Data | Components | Status |
| --- | --- | --- | --- | --- |
| Landing | `app/page.tsx` | `tracks`, `topics` | `components/landing/` | hero folder, roadmap cards, all topics, template teaser (phase 9) |
| Belajar | `app/belajar/[slug]` | `topics`, `slides`, `tips` | `PresentationViewer` | slides from DB and Storage (phase 3); summary and tips under the viewer (phase 5); opening it writes `progress` `sedang`, "Mulai latihan" (phase 6) |
| Template gallery | `app/template` | `data/templates.ts` | `TemplateGallery` | built on `/template` (phase 9) |
| Roadmap | `app/roadmap` | `tracks`, `track_nodes`, `track_edges` | `components/roadmap/` | graph, list and panel built (phase 5); node states from `progress` and Latihan/Flashcard links (phase 6); "Sudah paham? Langsung ujian" (phase 7) |
| Latihan | `app/latihan/[slug]` | `practice_questions`, `practice_sessions` | `components/quiz/` | built (phase 6); "Coba ujian" when the topic has a published exam (phase 7) |
| Flashcard | `app/flashcard` | `flashcards`, `flashcard_reviews`, `flashcard_queue()` | `components/flashcard/` | built (phase 6) |
| Ujian | `app/ujian/[slug]`, `[slug]/[attempt]` | `exams`, `exam_questions`, `exam_attempts` | `components/exam/` | built (phase 7): intro, timed runner, review; `/admin/ujian` for settings |
| Tips | inside `app/belajar/[slug]` | `tips` | - | built (phase 5, `/tips` page deferred) |
| Nilai, Dasbor | `app/nilai`, `app/dasbor` | `progress`, `exam_attempts` | `components/dashboard/` | `/nilai` (phase 7) and `/dasbor` built (phase 8); signed-in visitors of `/` go to `/dasbor` |
| Level, streak, lencana | `app/nilai`, `app/dasbor` | `track_levels`, `learning_streaks`, `learning_days`, `badges` | `components/dashboard/`, `lib/level.ts` | built (phase 8); level counts core topics passed by exam; public lencana deferred |
| Auth, Profil | `app/masuk`, `app/profil` | Supabase Auth, `profiles` | `components/auth/` | login, roles, `/admin` gate built (phase 1); `/profil` with ekspor data and hapus akun (phase 8) |
| Admin, impor AI | `app/admin` | `import_jobs`, all content tables | `components/admin/` | `/admin/impor`, `/admin/topik` built (phase 4), `/admin/roadmap` (phase 5); regenerate one section planned |
| Privasi | `app/privasi` | - | - | built |
| SEO | `opengraph-image.tsx`, `robots.ts`, `sitemap.ts` | `lib/site` | - | built |
| PWA | `app/manifest.ts`, `public/sw.js`, `public/offline.html` | - | `ServiceWorker`, `SignOutButton` | built (phase 9): installable, visited decks and roadmaps open offline |
| Illustrations | `app/not-found.tsx`, empty states, exam result | - | `components/illustrations/` | built (phase 9); login page has none yet |

Helpers worth knowing before writing a new one: `thumbSrc`, `coverSrc` and
`slideUrl` in `lib/slides.ts` (slide, thumb and cover file naming; never in
`lib/content.ts`, because `PresentationViewer` is a client component), `SITE_OG_IMAGE` in `lib/site.ts` (nested routes must reference it
explicitly). Update this table when a feature lands or a route moves.

## Build Order

Work top to bottom. A phase is done when its "done when" holds, the build
passes and the Features table is updated. Do not start a phase whose
prerequisites are open.

**Before any code**

- [x] `lms-ruang-materi` is a git repo pushed to GitHub (Actions needs it)
- [x] Supabase project created, URL and publishable key in `.env.local`
- [ ] At least one LLM key (Claude, OpenAI or Gemini) in GitHub Secrets
- [ ] Vercel project linked, env vars from Deployment Notes set
- [x] Supabase CLI installed (`supabase db reset`, `supabase test db`)

| # | Phase | Scope | Done when |
| --- | --- | --- | --- |
| 1 | Foundation | deps (`@supabase/ssr`, `@supabase/supabase-js`, `server-only`, `zod`, `vitest`), `lib/supabase/`, `proxy.ts`, `lib/dal.ts`, `/masuk`, `profiles` with `role`, security headers, `/privasi`, then `cacheComponents` | an admin can log in, a student cannot open `/admin`, signing up with `role` metadata still yields `student` |
| 2 | Content schema | content tables, `status`, RLS, Storage buckets, `lib/content.ts`, smoke test | drafts invisible to anon in `security_smoke.sql` |
| 3 | Migrate decks | `scripts/` uploads `public/slides/*` and inserts published topics and slides only; `lib/slides.ts`; `/belajar` reads the DB | every current `/belajar/<slug>` still works; `data/presentations*`, `public/slides`, `public/pptx` and `generate:*` removed |
| 4 | Admin + AI import | `/admin/impor`, `/admin/topik`, `worker/`, `worker/llm/`, workflow, then AI drafts for the 13 migrated decks | one pptx goes upload -> draft -> publish with each configured provider; no draft content in Actions logs |
| 5 | Roadmap + Tips | `/admin/roadmap`, `/roadmap`, tips inside Belajar, `lib/roadmap.ts` | a track renders as graph and mobile list, cycles and cross-track edges rejected |
| 6 | Latihan + Flashcard | `/latihan`, `practice_sessions`, `/flashcard`, `lib/leitner.ts`, `review_flashcard()` | practice works logged out, reviews schedule correctly (tests), 20 new cards a day max |
| 7 | Ujian + Nilai | exam functions, `/ujian`, `/admin/ujian`, `/nilai` | keys never reach a student before a pass or the last attempt, late, foreign and double submits rejected, parallel starts cannot exceed `max_attempts` (smoke test) |
| 8 | Dasbor + leveling | `/dasbor`, `/profil` with hapus akun and data export, level and streak views, lencana | level changes only after a passed exam; deleting an account leaves no learner rows and keeps content |
| 9 | Polish + PWA | landing reworked to tracks, `/template`, illustrations, empty states, manifest, `sw.js`, `/offline` | Screen Sketches matched on mobile and desktop; installable, a visited deck opens offline |

## Content Pipeline

All learning content lives in Supabase and is managed from `/admin`. Every
content row has `status`: `draft` or `published`. Public pages only ever see
`published`.

```
/admin/impor                 GitHub Actions (worker/)              Supabase
------------                 ------------------------              --------
upload .pptx  ------------------------------------------------>   Storage: imports/
Server Action: insert import_job, workflow_dispatch(job_id) --->
                             soffice pptx -> pdf -> AVIF slides -> Storage: slides/<slug>/<job_id>/
                             pdf -> LLM (structured output)    -> topics, tips, flashcards,
                                                                  practice_questions,
                                                                  exam_questions (draft)
                             job status: rendering, drafting,
                             done or failed + error  ---------->   import_jobs
/admin/topik/[slug]  <---- review, edit, approve ------------------
Publish (Server Action): publish_topic(slug) swaps drafts in per table,
                         updateTag('content')
```

- **Trigger**: the Server Action checks the admin role, inserts an
  `import_jobs` row, then calls the GitHub API `workflow_dispatch` with only
  the `job_id`. The worker reads everything else from the row.
- **Claim**: the worker starts with `update import_jobs set status =
  'rendering' where id = $1 and status = 'queued' returning *` and exits if
  no row comes back, so a replayed dispatch does nothing.
- **Logs**: the worker never logs draft content or LLM output, only job id,
  counts, timings and error class. Actions logs are public on a public repo.
- **Progress**: `/admin/impor` polls `import_jobs.status` every few seconds
  while a job runs. No websockets.
- **LLM provider is pluggable.** Each file in `worker/llm/` exports the same
  function, `generateDraft(pdf: Buffer, prompt: Prompt, model: string): Promise<DraftResult>`
  (`output: unknown` plus token counts),
  using that provider's official SDK. The worker picks the file from
  `import_jobs.provider` and `import_jobs.model`, chosen in a dropdown on
  `/admin/impor`. The dropdown lists providers from `LLM_PROVIDERS`, a
  comma list kept the same as a Vercel env var and an Actions variable; the
  app never sees the keys. The default comes from `LLM_PROVIDER` and
  `LLM_MODEL`.
- **Provider rules** that every implementation follows:
  - send the PDF itself (not extracted text) so slide images and diagrams are
    read; fall back to per-slide AVIF images only for a provider without PDF
    input
  - ask for JSON with the provider's structured output mode, using the JSON
    schema generated from the zod schema in `worker/prompt.ts`
  - stream or use a long timeout, decks can take minutes
  - treat refusals, truncated output and safety blocks as a failed job with
    the provider's reason in `import_jobs.error`, never as an empty draft
- **One validation for all.** Whatever a provider returns is parsed with the
  same zod schema before anything is written. Invalid output fails the job;
  nothing provider-specific reaches the database.
- **Adding a provider** is one new file in `worker/llm/`, one entry in the
  provider map, one secret. Nothing else changes. OpenRouter or any
  OpenAI-compatible endpoint can cover the rest with a `baseURL`.
- **Current defaults**: Gemini free tier (`gemini-3.8-flash`), the only
  free provider that reads PDF directly. The allowed models per provider live
  in `lib/llm.ts`; the worker refuses anything else. Pick model names from
  each provider's docs when adding them; do not guess model IDs. Free tier
  content may be used by Google for training: only admin decks go there.
  The free tier allows about 20 requests per model per day and often
  answers 503, so a failed job is retried with another model or the next day.
  OpenRouter `:free` models are the backup (`worker/llm/openrouter.ts`):
  the free `cloudflare-ai` parser sends the PDF as text only, 50 requests
  a day (1000 after 10 USD of credits).
- Every job stores `provider`, `model` and token usage, so drafts can be
  compared and cost tracked per import.
- **Cost limits**, enforced in the database when inserting `import_jobs`,
  not only in the UI:
  - one job in `queued`, `rendering` or `drafting` at a time (GitHub keeps
    only one pending run per concurrency group), counted for 30 minutes at
    most so a crashed worker cannot block imports
  - at most 10 jobs per day, a constant in the insert check function
  - decks over 80 slides are rejected; split them first
  - `/admin/impor` shows the slide count and a token estimate before the
    admin confirms
  - the workflow has `timeout-minutes: 20` and `concurrency: import-deck`
- **What the draft contains** per deck: a 2 to 3 paragraph summary, 3 to 6
  tips, 15 to 30 flashcards, 10 to 15 practice questions with explanations,
  40 exam questions with keys (twice the default `question_count`), and
  suggested prerequisites by topic slug. All in Bahasa Indonesia, all
  `draft`.
- **Exam and practice never overlap.** Publishing rejects an exam question
  whose prompt matches a practice prompt of the same topic.
- **Never auto-publish.** A human approves every topic. The admin can edit
  any field, regenerate one section, or delete items before publishing.
- **Re-import** of an existing slug writes slides to a new
  `slides/<slug>/<job_id>/` folder and creates a new draft set. Live slides
  and published content stay untouched until the new draft is published.
- **Unpublish and delete** also call `updateTag('content')`.
- **Existing decks**: phase 3 uploaded the 13 decks' AVIF slides to
  `slides/<slug>/migrasi/` and inserted them as published topics and slides.
  Their pptx files are in the private `imports` bucket under
  `migrasi/<slug>.pptx`; phase 4 drafts them (tips, flashcards, questions)
  through the normal import flow from there.

## Adding Content

- **Deck or topic**: upload the `.pptx` in `/admin/impor`, review the draft in
  `/admin/topik/[slug]`, publish.
- **Track**: build it in `/admin/roadmap`. Nodes reference published topics;
  prerequisites are edges between nodes, and cycles are rejected by the
  database.
- **Exam**: drafted by the import, edited in `/admin/ujian`. Answer keys live
  only in `exam_questions` and never leave the database except to admins.
- **Template**: `.html` in `public/templates/`, a 16:9 AVIF in
  `public/template-previews/`, an entry in `data/templates.ts`.

## Adding Code

- **Route**: a folder under `app/`. Dynamic segments read through
  `lib/content.ts` and call `notFound()` for unknown or unpublished slugs.
  Auth pages render the part that calls `lib/dal.ts` inside `<Suspense>`
  (required with `cacheComponents`); `dal.ts` redirects to `/masuk` when
  there is no user. Never add `generateStaticParams` to per-user routes.
- **Time and randomness** in a Server Component (`new Date()`,
  `Math.random()`) break prerendering under `cacheComponents`. Put them in a
  client component or behind `connection()`.
- **Component**: in its feature folder under `components/`, or `ui/` once two
  features use it. One responsibility per file, under 150 lines where
  practical. `PresentationViewer` is over; split it when you touch it.
- **Utility**: `lib/`, pure functions, no React imports.
- **Server writes**: Server Actions that call a Supabase RPC or an
  RLS-protected table. No API route unless a third party calls it.

Naming: `PascalCase` for components, `camelCase` for helpers, kebab-case for
slugs, Indonesian route names (`belajar`, `latihan`, `ujian`).

## Style

- **Light and dark, follows the system.** Write classes for dark: background
  `zinc-950`, text `zinc-50`, muted text `zinc-300` to `zinc-500`, borders
  `zinc-800/80`, surfaces `zinc-900`. `app/globals.css` mirrors the zinc scale
  under `prefers-color-scheme: light`, so no `dark:` or light variants are
  needed. Use zinc for neutrals, never `white`, `black` or hex, or that
  element will not flip.
- **Main accent: teal**, via the `accent` color (`text-accent`, `bg-accent`,
  `fill-accent/15`). It is `teal-400` on dark and `teal-600` on light, set in
  `app/globals.css`. Use it for the primary action, `selesai` and `sedang`
  states, passed, and highlights, not for body text.
- **Second accent: orange, for motivation and attention only**, via
  `accent-warm` (`text-accent-warm`, `bg-accent-warm/15`). It is `orange-400`
  on dark and `orange-600` on light. Use it for streak, level up and lencana,
  the exam timer warning (5 and 1 minute), "ragu-ragu" questions and the
  logo's spark. Nothing else.
  - Teal carries about 90% of the color on a screen, orange about 10%.
  - Orange appears as a badge, icon or small text, never as a button next to
    a teal one with equal weight. One dominant accent per screen.
- **State colors**: correct and passed use the accent, wrong and failed use
  `red-500`, `dilewati` uses `zinc-600` with a strikethrough. Warnings use
  `accent-warm`, never red, so "hampir habis" and "salah" never look alike.
- **Logo**: `components/brand/Logo.tsx` (`Logo`, `LogoMark`). A room, a
  rounded square open at its top right corner, holding two stacked slides:
  material laid out in a space whose door is open to anyone, growing
  outward, marked by a small spark dot at the gap. Room in `accent` (teal),
  slides too, spark in `accent-warm` (orange). `app/icon.svg` and
  `app/opengraph-image.tsx` repeat it with hex colors. Never recolor the
  room, never close the corner.
- **Fonts** from `next/font` in `app/layout.tsx`: Geist (`font-sans`), Geist
  Mono (`font-mono`, also for code in questions), Babylonica
  (`--font-signature`) for the signature link only.
- **Shapes**: `rounded-lg` for inputs and buttons, `rounded-xl` for nav
  pills and small cards, `rounded-2xl` for the featured card. Thin borders
  over shadows; `shadow-lg` only on floating menus and sheets.
- **Featured card**: each screen has at most one card that carries the main
  action ("Lanjutkan belajar", "Tinjau draf"), tinted mint with
  `border-accent/20 bg-accent/5`. Everything else stays neutral zinc.
- **App shell**: signed-in areas (dasbor, admin) use a left sidebar from
  `lg` with lucide icons; the active item is `bg-accent/10 text-accent`.
  Below `lg` it becomes a top bar with the nav on its own row.
- **Progress cards**: a number in text ("5 dari 12") with a thin
  `rounded-full` teal bar under it; the bar only repeats the text.
- **Sequences** (roadmap steps, missions) may use numbered cards because
  they are ordered: done shows a check, current a teal border, the rest
  stay muted. Visual direction taken from the DevOrbit reference, adapted:
  no emoji, no exclamation marks, no leaderboard, orange stays for streak.
- **Shared CSS** lives in `app/globals.css`: `scrollbar-thin`,
  `animate-word-in`, the `short:` variant for landscape phones. Reuse these
  before adding new utilities. Every animation needs a
  `prefers-reduced-motion` fallback.
- **Language**: UI text and README in Bahasa Indonesia, code comments in
  English.

## SEO Rules

Every public page must be findable and render a proper share card. The
setup lives in `app/layout.tsx` (defaults), `lib/site.ts` (name, URL,
description, OG image), `app/sitemap.ts`, `app/robots.ts` and
`app/opengraph-image.tsx`.

- **Indexed**: landing, `roadmap`, `belajar`, `latihan`, `template`,
  `privasi`.
  **Not indexed**: `admin`, `offline`, `flashcard`, `ujian`, `nilai`,
  `dasbor`, `masuk`, `profil`.
  Set `robots: { index: false }` on those and keep them out of the sitemap.
- **Metadata on every route.** Export `metadata` or `generateMetadata` with a
  `title` and `description` in Bahasa Indonesia. The title is the page name
  only; the layout template appends ` · Ruang Materi`. Keep titles under 60
  characters and descriptions around 120 to 155.
- **Canonical URL** via `alternates.canonical`, built from `SITE_URL`. Never
  hardcode the domain.
- **Open Graph and Twitter.** A route that sets its own `openGraph` or
  `twitter` must also pass `images: [SITE_OG_IMAGE]` (Twitter:
  `SITE_OG_IMAGE.url`), because a child's `openGraph` replaces the parent's
  instead of merging. Copy the pattern in `app/belajar/[slug]/page.tsx`.
- **Sitemap.** Every indexed route is in `app/sitemap.ts`, generated from
  published rows (tracks, topics) through `lib/content.ts`.
- **Static first.** Public pages render statically from published content
  (`lib/content.ts`, `'use cache'` + `cacheTag('content')`) with
  `generateStaticParams`. Publishing calls `updateTag('content')`, so pages
  refresh without a redeploy.
  - `lib/content.ts` uses only `lib/supabase/public.ts`. Calling `cookies()`
    inside `'use cache'` is a build error, and a cookie client could cache an
    admin's draft for everyone. It never reads drafts or `exam_questions`.
  - The build needs `NEXT_PUBLIC_SUPABASE_*` and at least one published topic
    and track, because `generateStaticParams` must return one param under
    `cacheComponents`. Fail with a clear message otherwise. Per-user bits (node states, "selesai" badges) load
  in a small client component on top; never make a public page dynamic just
  to read the session.
- **Headings.** One `<h1>` per page, then `<h2>` in order.
- **Images.** Use `next/image` with `fill` and `sizes` inside an
  aspect-ratio box, as the existing cards and viewer do (no layout shift).
  Content images get an Indonesian `alt` (`Sampul materi ...`,
  `..., slide 3 dari 20`); decorative ones get `alt=""`.
- **Language.** `lang="id"` and `locale: "id_ID"` stay as set in the layout.
- **OG image** is 1200x630 and drawn with inline hex colors, since
  `ImageResponse` cannot read CSS variables. Keep it in sync with the Style
  rules: zinc on dark, accent `#00d3bd` (teal-400).

## PWA

The mobile experience is an installable PWA, not a native app.

- `app/manifest.ts` (Next file convention): name, short name, `id` `/`,
  `start_url` `/` (the landing sends signed-in users on to `/dasbor`),
  `display: standalone`, theme and background
  `#09090b`, icons 192, 512 and a maskable 512 in `public/icons/`.
- One hand-written `public/sw.js`, no PWA library. It caches an allowlist
  only; anything not listed goes straight to the network:
  - cache first: `/_next/static/*`, fonts, icons, slide images
  - network first with cache fallback: HTML for `/`, `/belajar/*`,
    `/roadmap/*`, so a deck opened once can be read offline
  - never: any request with `?_rsc=`, Server Actions (POST), Supabase, and
    every route not listed above
  - offline fallback `public/offline.html` for navigations that fail: plain
    HTML with inline styles, because the Next.js chunks of an unvisited
    route are not cached and a Next page would fail to hydrate offline
- On sign-out the app tells the service worker to clear its page caches, so
  a shared phone keeps nothing from the previous learner.
- Serve `sw.js` with `Cache-Control: no-cache` and register it from a small
  client component in the root layout, production only.
- Ujian and flashcard review need a connection; show "Kamu sedang offline"
  instead of failing silently.
- Bump the cache name in `sw.js` on every change to it, and delete old caches
  on `activate`.

## Data Model

The source of truth is `supabase/migrations/`; this is the map. Every table
has `id uuid`, `created_at`, and content tables have `status`
(`draft` | `published`) and `updated_by`.

- Learner foreign keys (`profiles`, `progress`, `flashcard_reviews`,
  `practice_sessions`, `exam_attempts`, `badges`) are `on delete cascade`.
- Authoring foreign keys (`updated_by`, `import_jobs.created_by`) are
  `on delete set null`, so deleting an admin keeps the content.

| Table | Key columns | Notes |
| --- | --- | --- |
| `profiles` | `user_id`, `display_name`, `role`, `timezone`, `timezone_changed_at`, `guardian_consent` | 1:1 with `auth.users`; timezone changes once a day |
| `topics` | `slug`, `title`, `description`, `summary`, `draft_summary`, `status` | one per deck; publish moves `draft_summary` into `summary` |
| `slides` | `topic_id`, `index`, `path`, `width`, `height` | files in Storage `slides/<slug>/<job_id>/` |
| `tips` | `topic_id`, `body`, `position` | |
| `flashcards` | `topic_id`, `front`, `back`, `position` | republishing moves a learner's review to the new card with the same front |
| `practice_questions` | `topic_id`, `type`, `prompt`, `code`, `options`, `answer`, `explanation` | public when published |
| `exams` | `topic_id`, `duration_minutes`, `max_attempts`, `pass_score`, `question_count` | defaults 30, 3, 70, 20; bank needs 2x `question_count` |
| `exam_questions` | `exam_id`, same shape as practice | admin only; a question an attempt used is `archived`, never deleted |
| `tracks` | `slug`, `title`, `description`, `status` | |
| `track_nodes` | `track_id`, `topic_id`, `optional`, `position` | |
| `track_edges` | `from_node_id`, `to_node_id` | prerequisites, no cycles |
| `progress` | `user_id`, `topic_id`, `state`, `last_slide`, `updated_at` | `state`: belum, sedang, selesai, dilewati; written through `touch_progress()`, learners update only `state` and `last_slide` |
| `flashcard_reviews` | `user_id`, `flashcard_id`, `box`, `due_on`, `reviewed_at`, `added_on` | Leitner box 1 to 5, written by `review_flashcard()` |
| `practice_sessions` | `user_id`, `topic_id`, `correct`, `total`, `finished_at` | `finished_at` stamped by the database |
| `exam_attempts` | `user_id`, `exam_id`, `question_ids`, `option_orders`, `started_at`, `deadline`, `submitted_at`, `answers`, `score`, `passed` | written by functions only |
| `badges` | `user_id`, `track_id`, `granted_at` | written by functions only |
| `import_jobs` | `created_by`, `file_path`, `original_name`, `slug`, `provider`, `model`, `slide_count`, `status`, `error`, `input_tokens`, `output_tokens`, `prerequisites` | `status`: queued, rendering, drafting, done, failed |

Views: `track_levels` (the caller's core topics passed by exam per track;
the level name comes from `lib/level.ts`), `learning_streaks` (user, current
days, best days) over `learning_days`, one row per day with a review, a
finished latihan set or an exam submit, dated in the learner's timezone when
it happened.

Constraints every migration keeps:

- Unique `(user_id, flashcard_id)`, `(user_id, topic_id)` on `progress`,
  `(user_id, track_id)` on `badges`, `(topic_id, status, index)` on `slides`
  (draft slides sit next to live ones until publish),
  `slug` on `topics` and `tracks`.
- `topics.slug` and `tracks.slug` match `^[a-z0-9-]+$`.
- `answer` is within the bounds of `options`; `options` has 2 or 4 items by
  `type`.
- `track_edges` connect two nodes of the same track; cycles are rejected.
- `profiles.timezone` exists in `pg_timezone_names`; changing it does not
  rewrite past activity dates.

## Database Rules Live in the Database

Same model as Workdesk: Supabase with RLS. Ownership, grading, attempt
limits and the timer are enforced by RLS policies and functions, not by the
UI. The UI only hides actions the database would refuse.

- **RLS on every table**, no exceptions. A table without a policy is denied.
- **Own rows only, and mostly read-only.** Learners read their own rows
  (`auth.uid() = user_id`); admins read all. Writes:
  - `progress`: owner insert and update, but a trigger rejects `selesai`
    from the client when the topic has a published exam.
  - `flashcard_reviews`: only through `review_flashcard(card_id, rating)`,
    which stamps `now()` and enforces the 20 new cards a day.
  - `practice_sessions`: owner insert; `finished_at` is set by a default and
    a trigger, never by the client.
  - `exam_attempts`, `badges`: select only. Functions write them.
- **Exams are graded on the server.** `start_exam_attempt(exam_id)` checks the
  attempt limit, stamps `started_at` and returns questions without answer
  keys. `submit_exam_attempt(attempt_id, answers)` grades against the keys,
  rejects late submits (`started_at + duration`, plus 30 seconds of grace)
  and writes the score. Clients cannot insert or update scores directly, and
  cannot select `exam_questions.answer`. Both functions are
  `security definer` and check:
  - the exam is published
  - `attempt.user_id = auth.uid()` and `submitted_at is null` on submit
  - attempts are counted under `for update` on the learner's exam row, and
    unsubmitted attempts count toward `max_attempts`
  - after `max_attempts` failures, a new start is refused until 24 hours
    after the last submit
  - submitted answers only reference the attempt's `question_ids`

  ```
  browser                         database
  -------                         --------
  start_exam_attempt(exam) -----> limit ok? stamp started_at
                           <----- attempt_id, questions (no keys)
  answers in localStorage
  submit_exam_attempt(id, ans) -> on time? grade vs keys
                                  write score, mark node selesai
                           <----- score, review
  ```

- **Roadmap `selesai` from an exam** is set by `submit_exam_attempt`, not by
  the client. Topics without an exam may be marked by the learner.
- **Level, streak and lencana are derived, never written by the client.**
  Level and streak are views over `exam_attempts` and `flashcard_reviews`;
  lencana rows are inserted only by `submit_exam_attempt` when a track's last
  core node passes. No insert or update policy for clients on any of them.
- **Content tables** (`tracks`, `track_nodes`, `topics`, `slides`, `tips`,
  `flashcards`, `practice_questions`): anyone reads `status = 'published'`
  rows, only admins read drafts and write. `exam_questions` is admin-only,
  learners reach it solely through the exam functions.
- **Roadmap cycles and cross-track edges** are rejected by a trigger on
  `track_edges`.
- **Import jobs**: admins insert and read `import_jobs`; only the worker
  (service role) updates status, error and usage. Storage bucket `imports` is
  private, admin upload only; `slides` is public read, worker write only.
  Draft slides live in a new `<job_id>` folder, so they never replace live
  ones before publish.
- **Roles**: `profiles.role` is `student` or `admin`.
  - The new-user trigger always inserts `role = 'student'` and ignores
    `raw_user_meta_data`.
  - Learners may update only `display_name`, `timezone` and
    `guardian_consent` (column grants).
  - Role changes need the service role. A smoke case proves a learner's role
    update fails.
- **Hapus akun** is `delete_own_account()`, `security definer`, scoped to
  `auth.uid()`. It deletes the auth user (learner tables cascade). Learners
  cannot upload, so they own no Storage objects.
- Every rule that protects data gets a case in
  `supabase/tests/security_smoke.sql`. Run it on the local stack
  (`npx supabase start`, `db reset`, `test db`), then `npm run db:push`.
  The test rolls back, so it can also run against the remote project with
  `supabase test db --db-url`.
- A dev admin for testing lives in the remote project; its login is
  `DEV_ADMIN_EMAIL` / `DEV_ADMIN_PASSWORD` in `.env.local`.
  A dev student (role `student`) sits beside it as `DEV_STUDENT_EMAIL` /
  `DEV_STUDENT_PASSWORD`, for checking the learner side.

## Security Rules

- **Auth checks sit next to the data.** `lib/dal.ts` imports `server-only`,
  gets the user with `supabase.auth.getUser()` (never `getSession()` on the
  server) and is the only way pages and Server Actions read user data.
  `proxy.ts` only refreshes the session; it is not the gate.
- **Server Actions re-check the user** and validate input shape before calling
  Supabase. Never take `user_id` from the form, use `auth.uid()`.
- **Keys**: only `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` reach the browser. The service role
  key and every LLM key (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`,
  `GEMINI_API_KEY`, ...) live only in GitHub Actions secrets, never in the app
  or on Vercel. The phase 3 script reads the service role key from
  `.env.local`, which is gitignored. Vercel holds one server-only secret,
  `GITHUB_DISPATCH_TOKEN`: a fine-grained token for this repo with
  `actions: write` and nothing else. A replayed dispatch is harmless because
  the worker claims only `queued` jobs.
- **Admin routes** check `role = 'admin'` in `lib/dal.ts` on every page and
  Server Action, not only in the layout.
- **Uploads**: `.pptx` only, checked by extension and the zip magic bytes,
  max 50 MB, stored under a generated name. The original file name is
  display text, never a path.
- **Deck content is untrusted input to the LLM.** A slide can contain text
  that tries to steer the model. The prompt marks the deck as data, the
  output must pass the zod schema, and a human reviews before publish. The
  model never gets tools or any key.
- **Workflow inputs**: the worker accepts only `job_id` (a UUID, validated)
  and reads the rest from the database, so a dispatch cannot inject paths or
  commands.
- **Slugs come from published content only.** Never build a file path, `fetch` URL or
  `import` from a raw route param.
- **No `dangerouslySetInnerHTML`** for content, questions or answers. Code in
  questions renders in `<pre><code>` as text.
- **Templates run in a sandbox.** The preview `<iframe>` uses
  `sandbox="allow-scripts allow-popups"`. Never add `allow-same-origin` next
  to `allow-scripts`. Review any new template `.html` for external scripts
  and trackers before adding it.
- **Scripts use `execFile`, never `exec`.** File names are passed as
  arguments, not interpolated into a shell string.
- **Redirects after login** only go to a relative path starting with `/`, so
  `?next=` cannot send users off-site.
- **Login**: magic link by default, or email + password for accounts that
  have one (admins created in the dashboard). No sign-up with password from
  the app.
- **Rate limits**: magic link, OTP and password sign-in limits are set in
  Supabase Auth.
  `start_exam_attempt` is limited by `max_attempts` in the database; Server
  Actions that write (progress, reviews) are idempotent, so a double click
  writes once.
- **Security headers** in `next.config.ts`: `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, and
  `Content-Security-Policy: frame-ancestors 'self'`. Not `X-Frame-Options:
  DENY`, it would break the template preview iframe.

## Privacy (UU PDP)

- **Collect the minimum**: email (for login), display name, timezone, and
  learning activity. No phone number, birth date, school or address.
- **`/privasi`** says in plain Bahasa Indonesia what is stored, why, and
  where. It names every processor and its region (Supabase, Vercel, GitHub,
  and the LLM providers that see admin-uploaded decks, never learner data),
  since data leaves Indonesia. It also explains export and deletion.
- **Hapus akun** in `/profil` calls `delete_own_account()`. It asks for the
  email typed back as confirmation.
- **Ekspor data** in `/profil` downloads the learner's own rows as JSON.
- **Minors**: learners under 18 confirm a parent or guardian agrees
  (`profiles.guardian_consent`) before their progress is saved.
  `require_consent()` refuses every learner insert until then; Dasbor asks
  once with "Saya konfirmasi".
- **Breach**: if learner data leaks, affected users and the authority are
  told within 3x24 jam. The steps live in `/privasi` and this file.
- **Learner data never goes to an LLM.** Only admin-uploaded decks are sent.
- **No third-party trackers** or ad scripts. Vercel Analytics without cookies
  is the most allowed.

## Tests

`npm run build` type checks and prerenders every public page, so a broken
published row or bad slug fails the build. Add Vitest (node environment, no
jsdom) with the first pure helper that can silently break: `lib/leitner.ts`,
`lib/roadmap.ts` (state, unlocking), the draft zod schema in
`worker/prompt.ts` (one valid and one broken sample per provider) and the
slide path helpers in `lib/slides.ts`. Add a case there when you touch one of those.
Database rules are proved by `supabase/tests/security_smoke.sql`, not by
Vitest.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Type check, then production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint over the repo |
| `npm run test:run` | Vitest, single pass (added in phase 1) |
| `npm run db:push` | Apply `supabase/migrations` to the remote project through the session pooler (`SUPABASE_POOLER_HOST`, `SUPABASE_DB_PW`) |
| `npm run draft:decks -- <slug>...` | Draft migrated decks one at a time through the import workflow, as the dev admin; `IMPORT_MODEL=provider:model` overrides the default |

## Deployment Notes

- The import worker runs in GitHub Actions (`ubuntu-latest`, installs
  LibreOffice and poppler-utils), as
  `node worker/import-deck.ts --job-id "$JOB_ID"` (Node 22 strips
  types, imports use `.ts` extensions). Secrets there:
  `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and the LLM keys; variables
  `LLM_PROVIDERS`, `LLM_PROVIDER`, `LLM_MODEL`.
- Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  (needed at build time too), `GITHUB_DISPATCH_TOKEN`, `GITHUB_REPO`
  (`owner/name`), `LLM_PROVIDERS`.
- `'use cache'` needs `cacheComponents: true` in `next.config.ts`. Before
  turning it on, move the footer year (`new Date().getFullYear()` in
  `app/page.tsx`) into a client component, then confirm `npm run build`
  passes.
- `images.unoptimized` is on in `next.config.ts` on purpose: slides are
  already AVIF, a second pass by the Next optimizer softens them.
- `NEXT_PUBLIC_SITE_URL` sets canonical and OG URLs. Without it they fall back
  to `https://lms-ruang-materi.vercel.app`; set it on Vercel if the domain changes.
- Add the site URL to Supabase Auth redirect URLs for the magic link.
