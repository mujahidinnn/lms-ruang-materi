# Code practice in the browser (sub-project 2)

Learners write and run code inside a chapter and get automatic checks,
like Dicoding's interactive exercises. Builds on chapters
(`docs/superpowers/specs/2026-10-11-chapters-design.md`). Sub-project 3
(final project and certificate) gets its own spec.

## Intent

Agreed with the owner (2026-10-11):

- Exercises live inside chapters: instructions, an editor, "Jalankan" to see
  output or a preview, "Periksa" to run automatic tests that list which
  checks pass. Same instant feedback, sounds and confetti as practice.
- Languages: HTML/CSS/JavaScript, Node.js/Express (logic only), SQL, and Git
  (a simulated terminal). Built in three phases: 2a web + JS + Express, 2b
  SQL, 2c Git.
- Learner code never runs on our servers. It runs in the learner's browser,
  in a sandboxed iframe with no same-origin access.
- Exercises are drafted by the import worker with the chapters and edited by
  admins, like the rest of the content.
- A passed exercise is recorded, and a chapter with exercises is complete
  only when its quiz is all correct and every exercise has passed.

Success: a learner in the JavaScript, React, SQL, Express or Git topics can
type code in a chapter, run it, see which checks pass, and have the result
count toward the chapter.

## Exercise kinds

| Kind | Editor | Runs | Checks |
| --- | --- | --- | --- |
| `web` | tabs HTML, CSS, JS | iframe `srcdoc` with the three files | JS expressions over the live `document` (e.g. `document.querySelector('h1')?.textContent.trim() === 'Halo'`) |
| `js` | one JS file | iframe; `console.log` shown | JS expressions run after the code (e.g. `jumlah(2, 3) === 5`); `setup` code runs first |
| `express` | one JS file | iframe with a built-in mini-Express shim (`require('express')`, `app.get/post/put/delete/use`, `res.status/json/send`, `req.params/query/body`) | expressions over a `request(method, path, body)` helper that calls the learner's routes, e.g. `(await request('GET', '/produk/1')).status === 200` |
| `sql` (2b) | one SQL editor | sql.js (SQLite WASM) in the page, fresh database per run from `setup` (schema + seed) | the learner's last result set compared with the solution's on a fresh database (order-insensitive unless the solution has ORDER BY); optional `check` queries after DML |
| `git` (2c) | simulated terminal | a TypeScript model of a repo: files from `setup`, commands `git init/status/add/commit -m/branch/switch/checkout (-b)/log --oneline/merge/restore`, plus `ls`, `cat`, `echo text > file`, `touch` | expressions over a read-only `repo` snapshot (branches, current branch, commits, staged and working files) |

All checks are evaluated inside the sandbox iframe (also for `sql` and
`git`, whose state is passed in as JSON), so a check written by the AI or an
admin can never touch the page, cookies or storage. Each run has a 3 s time
limit; an infinite loop kills the iframe and reports "Kode berjalan terlalu
lama".

## Data model

| Table | Columns | Notes |
| --- | --- | --- |
| `code_exercises` | `id`, `chapter_id` (fk cascade), `position`, `kind` enum (`web`, `js`, `express`, `sql`, `git`), `title`, `prompt` (markdown), `starter` jsonb (`{html, css, js}` or `{code}`), `solution` jsonb (same shape), `setup` text, `tests` jsonb (`[{name, check}]`), `updated_by` | visible when its chapter is (same policy shape as `chapter_questions`); admin all |
| `code_progress` | `user_id`, `exercise_id`, `passed_at`, `code` jsonb (the passing code, to show on return) | pk `(user_id, exercise_id)`; read own or admin; written only by `pass_code_exercise()` |

- `pass_code_exercise(p_exercise uuid, p_code jsonb)`: security definer,
  `search_path = ''`, authenticated only; the exercise's chapter and topic
  must be published; consent required (`require_consent` trigger); upsert;
  logs a learning day.
- `complete_chapter()` gains a rule: if the chapter has exercises, every one
  must have a `code_progress` row for the caller, else `P0001 "Selesaikan
  latihan kode di bab ini dulu"`.
- Checks are client-side and the tests are public (like practice keys); the
  record means "the learner ran it and it passed", not proof.

## Runner

- `components/code/Sandbox.tsx`: builds the iframe document per kind
  (`sandbox="allow-scripts"`, no `allow-same-origin`), posts
  `{kind, files, setup, tests, state}` in, receives
  `{logs, results: [{name, pass, error}], preview?}` via `postMessage` with a
  per-run nonce; terminates after 3 s.
- `lib/code/express-shim.ts` (source string injected into the iframe),
  `lib/code/sql.ts` (sql.js loader, lazy; wasm in `/public/sqljs/`),
  `lib/code/git.ts` (pure repo model + command parser, unit tested).
- Editor: CodeMirror 6 (`@codemirror/*`), loaded lazily on chapter pages
  with exercises; language modes html, css, javascript, sql. Git uses a
  terminal component (input line + scrollback), no CodeMirror.

## Learner UI (pastel style)

- In the chapter page, after the body and before the quiz: one card per
  exercise ("Latihan kode"), with the prompt, the editor (tabs for web),
  "Jalankan" (secondary) and "Periksa" (primary), the output/preview panel,
  and the check list (mint pass, pink fail, with the error text).
- All checks pass: correct sound, confetti burst, "Lolos", and
  `pass_code_exercise` for signed-in learners (guests see the sign-in hint).
- "Lihat solusi" appears after two failed checks; "Reset kode" restores the
  starter. The learner's draft code is kept in localStorage per exercise.
- Returning learners see their passing code.
- Phones: editor full width, preview below; the terminal is usable with the
  on-screen keyboard.

## AI drafting

- `draftSchema.chapters[].exercises`: 0 to 2 per chapter, kinds limited to
  what the topic needs (web for HTML/CSS/React/Vue, js for JavaScript,
  express for Express/Node, sql for SQL, git for Git topics).
- The worker validates what it can before saving: `js` and `express` by
  running the solution against the tests in a Node `vm` with the same shim,
  `sql` with sql.js in Node, `git` with the same repo model; an exercise
  whose solution fails its own tests is dropped (not the whole draft).
  `web` exercises are not executed in the worker and are flagged for admin
  review.

## Admin

- In `/admin/topik/[slug]`, under each chapter: its exercises with editors
  for title, kind, prompt, starter, solution, setup and tests (JSON), and a
  "Uji solusi" button that runs the solution through the same sandbox and
  shows the check list. Add/delete per chapter.

## Testing

- Smoke tests: exercises hidden for draft chapters; `code_progress` own-only
  and not directly writable; `pass_code_exercise` refuses unpublished; the
  `complete_chapter` exercise rule.
- Vitest: git model (every command and error), SQL result comparison, check
  message protocol helpers, worker validation (good and failing solutions).
- E2E (guest): open a chapter with a `js` exercise, run a wrong then a
  right answer, see the check list turn mint.
- Visual: exercise card on desktop/phone, light/dark.

## Phases

1. 2a: tables, RPC, chapter rule, sandbox runner for `web`/`js`/`express`,
   editor, chapter UI, admin editor, worker drafting + validation for these
   kinds.
2. 2b: `sql` kind (sql.js runner, comparison, worker validation).
3. 2c: `git` kind (repo model, terminal UI, worker validation).
Each phase ships on its own; re-import topics after each to fill exercises.

## Out of scope

Real Node.js processes, npm installs, network calls from learner code,
server-side grading, plagiarism checks, final projects and certificates
(sub-project 3).
