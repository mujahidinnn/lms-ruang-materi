# Kelas ala Dicoding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every topic becomes a class learnable without slides: deep chapters with code practice, a visible path to a final exam, a final project and an opt-in certificate.

**Architecture:** The import worker writes a class in two stages (outline, then one call per chapter) and can run locally through Gemini on the web (owner's rule: no API quota for generation). New tables `projects`, `project_progress`, `certificates` with SQL functions hold the rules; Astro pages show the path and the certificate.

**Tech Stack:** Astro 7 + React 19 islands, Supabase Postgres (RLS, pgTAP), Node 22 worker, zod 4, playwright-core (Gemini web), vitest.

**Spec:** `docs/superpowers/specs/2026-10-21-kelas-ala-dicoding-design.md`

## Global Constraints

- Chapter body target 900-1500 words in the prompt; schema floor 2500 characters; 0-1 slide embed; 4-12 chapters.
- Chapter quiz 3-5 questions; 0-2 code exercises per chapter; at least half practice chapters when the deck's code runs here (web, js, express).
- Exam stays open (no gate). Certificate requires: every published chapter done, exam passed, project passed when the topic has a published project.
- Certificate is opt-in ("Terbitkan sertifikat"), needs `profiles.display_name`, copies the name at issue time, one per learner per topic, public page `/sertifikat/[kode]` not indexed.
- A topic with a project that is not verified cannot be published.
- Re-import reuses existing chapter slugs for the same part of the deck.
- Gemini web: reuse the logged-in Chrome profile `~/.sopi-gemini` on its own debug port; never log deck content or model output.
- UI: GUIDELINE Style (black, white, matcha); copy in Indonesian, code comments in English.

## Review Focus

1. A Gemini web answer with prose around the JSON, or JSON cut mid-way: parse the first fenced or bare JSON object; a cut answer is a retry, never a partial write.
2. A learner who passed the exam before this ships: `certificate_status` reports eligible without any backfill.
3. A topic with no chapters (slides only): certificate needs only the exam (and project if any); the class page shows the old slide layout.
4. Issuing twice (double click, two tabs): second call returns the existing certificate, no duplicate.
5. Republishing a topic after edits: certificates already issued stay valid; `projects` draft swap does not cascade-delete `project_progress` of a project kept by id.

---

### Task 1: Two-stage schemas and prompts

**Files:**
- Modify: `worker/prompt.ts`
- Test: `worker/prompt.test.ts`

**Interfaces:**
- Produces:
  - `classSchema` (zod): all `draftSchema` fields except `chapters`, plus `outline: Outline[]` (4-12) and `project: Project | null`.
  - `Outline = { slug, title, est_minutes, slide_from, slide_to, goals: string[] (2-4), code_kind: "web"|"js"|"express"|"none" }`.
  - `chapterSchema` (zod): `{ body: string (min 2500), quiz: question[] (3-5), exercises: exercise[] (0-2) }`.
  - `Project = exercise & { brief: string }` with tests 5-12.
  - `buildClassPrompt(knownSlugs: string[], current: {slug: string; title: string}[]): Prompt`
  - `buildChapterPrompt(topicTitle: string, outline: Outline[], index: number): Prompt`
  - `buildFixPrompt(ex: Exercise, failing: string[]): Prompt`
  - `repairClass(output, slideCount): unknown`, `repairChapter(output): unknown`
  - `type Draft` unchanged in shape (chapters carry `body, quiz, exercises` from stage 2 merged with outline fields) plus `project: Project | null`.
  - `classJsonSchema`, `chapterJsonSchema`, `exerciseJsonSchema` (from `z.toJSONSchema`).

- [ ] **Step 1: Tests** in `worker/prompt.test.ts`: `classSchema` accepts 12 outline items and rejects 13; `chapterSchema` rejects a 2000-character body; `repairChapter` keeps 5 of 6 quiz questions and drops an invalid exercise; `buildClassPrompt([], [{slug:"pengenalan",title:"Pengenalan"}]).user` contains `pengenalan`; `buildChapterPrompt` user text contains the chapter title, its goals, its slide range and "900 sampai 1500 kata"; existing `draftSchema`/`repairDraft` tests keep passing (draftSchema now allows 4-12 chapters).
- [ ] **Step 2:** `npx vitest run worker/prompt.test.ts` fails.
- [ ] **Step 3:** Implement. Prompt rules to add (Indonesian, verbatim in spirit): chapter order `## Tujuan`, explanation in `##`/`###` sections, at least one worked code example when the deck has code, `## Rangkuman` with 3-6 bullets; "paling banyak 1 sisipan slide, hanya untuk diagram"; facts only from the deck; code exercises required in chapters whose `code_kind` is not `none`. Stage 1 asks to reuse a current slug when a chapter covers the same part.
- [ ] **Step 4:** Tests pass. **Step 5:** Commit `Worker: two-stage class and chapter schemas`.

### Task 2: Providers take a schema; Gemini web provider

**Files:**
- Modify: `worker/llm/types.ts`, `worker/llm/gemini.ts`, `worker/llm/openrouter.ts`, `worker/llm/index.ts`, `lib/llm.ts`
- Create: `worker/llm/gemini-web.ts`, `worker/llm/json.ts`
- Test: `worker/llm/json.test.ts`

**Interfaces:**
- Produces: `GenerateDraft = (pdf: Buffer, prompt: Prompt, model: string, jsonSchema: unknown) => Promise<DraftResult>`; `extractJson(text: string): unknown` (throws `ProviderError("no JSON")`); provider key `gemini-web`, model `web` (added to `LLM_MODELS`, not to `LLM_PROVIDERS` on Vercel, so admin's dropdown does not offer it).

- [ ] **Step 1: Tests** for `extractJson`: a ```json fenced block with prose before and after; a bare object; two blocks (first wins); a cut answer `{"a": [1, 2` throws.
- [ ] **Step 2:** Fails. **Step 3:** Implement. `gemini-web.ts` follows `porto/sopi/scripts/gemini-web.mjs`: profile `~/.sopi-gemini`, port 9334, headless unless `GEMINI_WEB_SHOW=1`, temporary chat, paste the PDF as a `File` (`application/pdf`) into the input, insert system + user prompt + "Jawab hanya dengan satu blok ```json" + the JSON schema, wait for the response to stop changing for 5 s (timeout 10 min), `extractJson` on the last `model-response` innerText. Token counts are 0. Keep the SEL map and the `ponytail:` note about selectors.
- [ ] **Step 4:** Tests pass; `npx tsc -p worker` is not configured, so run `npx astro check` (covers worker files). **Step 5:** Commit `Worker: schema per call, Gemini web provider`.

### Task 3: Worker runs the stages and can run locally

**Files:**
- Modify: `worker/import-deck.ts`, `scripts/draft-decks.mjs`, `package.json`
- Test: `worker/prompt.test.ts` (assembly helper)

**Interfaces:**
- Consumes: Task 1 schemas/prompts, Task 2 `GenerateDraft`.
- Produces: `assembleDraft(cls: ClassOut, chapters: (ChapterOut | null)[]): Draft` in `worker/prompt.ts` (drops null chapters, merges outline fields, throws `SchemaError` under 4 chapters); `writeDraft` also writes `projects` (Task 4 table) as `status: 'draft'`.

- [ ] **Step 1: Test** `assembleDraft` with 5 outlines and one `null` chapter returns 4 chapters with outline slugs; with 3 survivors throws.
- [ ] **Step 2:** Fails. **Step 3:** Implement: stage 1 with `classJsonSchema`; per chapter call with retry once; `validateExercises` per chapter, and for a failing js/express exercise one `buildFixPrompt` call before dropping; project validated the same way (`verified_at` set when a js/express solution passes). `--local` flag on `draft-decks.mjs`: instead of dispatching GitHub, run `node worker/import-deck.ts --job-id <id>` locally with `SUPABASE_URL` from `NEXT_PUBLIC_SUPABASE_URL`. `npm run draft:local -- <slug>` = `IMPORT_MODEL=gemini-web:web draft:decks --local`.
- [ ] **Step 4:** Tests pass. **Step 5:** Commit `Worker: draft classes chapter by chapter, run locally`.

### Task 4: Projects and certificates in the database

**Files:**
- Create: `supabase/migrations/20261021000000_projects_certificates.sql`
- Modify: `supabase/tests/security_smoke.sql`

**Interfaces:**
- Produces:
  - `projects (id, topic_id, status content_status, kind code_kind, title, brief, prompt, starter, solution, setup, tests, verified_at timestamptz null, updated_by, created_at)`, unique `(topic_id, status)`; RLS: admin all, read published of a published topic.
  - `project_progress (user_id, project_id, passed_at, code)` pk `(user_id, project_id)`; read own or admin; written only by `pass_project(p_project uuid, p_code jsonb)` (same checks as `pass_code_exercise`, consent trigger, learning day trigger).
  - `certificates (id, code text unique, user_id, topic_id, name text, issued_at)` unique `(user_id, topic_id)`; RLS: owner reads and deletes; public read goes through `certificate_by_code(p_code text)` returning `(code, name, topic_title, topic_slug, issued_at)`.
  - `certificate_status(p_topic uuid) returns jsonb` `{chapters_done, chapters_total, exam_passed, project_required, project_passed, eligible, code}` for `auth.uid()`.
  - `issue_certificate(p_topic uuid) returns text` (the code): raises `P0001 'Isi nama tampilan di Profil dulu'` when the name is empty, `P0001 'Belum memenuhi syarat sertifikat'` when not eligible; returns the existing code on a second call. Code: 10 chars from `upper(encode(gen_random_bytes(...), 'hex'))` grouped `XXXXX-XXXXX`.
  - `publish_topic` swaps projects (delete published, promote draft) and raises `P0001 'Proyek akhir belum lolos uji solusi'` when the topic's project has `verified_at is null`.
- [ ] **Step 1: pgTAP** additions (update `plan(n)`): anon cannot read draft projects; learner can `pass_project` a published project, not a draft one; `certificate_status` eligible after chapters + exam + project; `issue_certificate` errors without name, returns same code twice; `certificate_by_code` works as anon; other learner cannot select the certificate row; `publish_topic` refuses unverified project.
- [ ] **Step 2:** `npx supabase start && npx supabase test db` fails. **Step 3:** Write the migration. **Step 4:** `npx supabase test db` passes; `npm run db:push`. **Step 5:** Commit `Projects and opt-in certificates in the database`.

### Task 5: Admin edits and verifies the project

**Files:**
- Modify: `src/pages/admin/topik/[slug].astro`, `lib/actions/admin-latihan-kode.ts` (add project functions), `lib/actions/index.ts` if needed
- Create: `components/admin/ProjectEditor.tsx` (wraps the `ExerciseEditor` form fields plus `brief`)

**Interfaces:**
- Produces: actions `simpanProyek(form)`, `tambahProyek(form)`, `hapusProyek(form)`, `verifikasiProyek(id: string)` (sets `verified_at = now()` after "Uji solusi" passes in the browser).
- [ ] **Step 1:** Editor section "Proyek akhir" under the chapters; "Uji solusi" button runs the solution in the sandbox (reuse `useSandbox`) and calls `verifikasiProyek` on pass; badge "Terverifikasi" / "Belum diuji".
- [ ] **Step 2:** `npx astro check` clean; screenshot `/admin/topik/nodejs` (read-only browse). **Step 3:** Commit `Admin: final project editor with Uji solusi`.

### Task 6: Class page shows the path

**Files:**
- Modify: `components/belajar/CourseView.tsx`, `src/pages/belajar/[slug]/index.astro`, `lib/content.ts` (topic carries `project: {id,title} | null` and per-chapter `exerciseCount`, `quizCount`)
- Create: `components/belajar/ClassPath.tsx` (island: reads `certificate_status` for signed-in learners)

**Interfaces:**
- Consumes: `certificate_status`, `issue_certificate` (browser Supabase client RPC, like `complete_chapter` today).
- [ ] **Step 1:** Syllabus rows show minutes and parts (Materi, Kode n, Kuis n) and the done mark. Closing steps in order: Latihan soal (`/latihan/[slug]`), Simulasi ujian (`/latihan/[slug]/persiapan`), Ujian akhir (`/ujian/[slug]`), Proyek akhir (`/belajar/[slug]/proyek`, only when a project exists), Sertifikat. States: belum / selesai / "selesaikan N bab lagi". "Terbitkan sertifikat" when eligible; sends to `/profil#data` when the RPC says the name is empty; links `/sertifikat/[kode]` once issued. "Bahan pendukung": slides, flashcard, tips.
- [ ] **Step 2:** `npx astro check`; e2e `a course lists chapters...` still passes; screenshots light, dark, phone. **Step 3:** Commit `Class page: the path from chapters to certificate`.

### Task 7: Chapter page contents and checklist

**Files:**
- Modify: `src/pages/belajar/[slug]/[bab].astro`, `components/belajar/MarkdownBase.tsx` (heading ids)
- Create: `lib/toc.ts` + `lib/toc.test.ts`

**Interfaces:**
- Produces: `toc(body: string): { id: string; text: string }[]` from `## ` headings (ignores ones inside code fences); `headingId(text: string): string` used by MarkdownBase for `h2` ids.
- [ ] **Step 1: Tests:** `toc` returns `Tujuan`, `Rangkuman`; skips `## x` inside a ``` block; ids are kebab-case ASCII.
- [ ] **Step 2:** Fails → implement → pass. **Step 3:** Page: "Di bab ini" list beside/above the body (sticky on lg), and a closing checklist (Baca, Latihan kode n, Kuis) before the next-step links. **Step 4:** Commit `Chapter page: contents and checklist`.

### Task 8: Project page and certificate page

**Files:**
- Create: `src/pages/belajar/[slug]/proyek.astro`, `src/pages/sertifikat/[kode].astro`
- Modify: `components/code/CodeExercise.tsx` (prop `passRpc: "pass_code_exercise" | "pass_project"`, default the first), `src/pages/nilai.astro` (list own certificates), `GUIDELINE.md` (Product flow, Out of Scope line on certificates, Data Model, Features table)

- [ ] **Step 1:** Project page: brief (markdown) + `CodeExercise client:load passRpc="pass_project"`; 404 when the topic has no published project. Certificate page: `certificate_by_code`, 404 when unknown, `noindex`, print CSS (A4 landscape, `@page`), black/matcha design with name, class, date, code and the verify URL; "Cetak" button (`window.print()` inline script).
- [ ] **Step 2:** `npx astro check`; screenshot both; e2e: certificate page with an unknown code returns 404. **Step 3:** Commit `Final project and certificate pages`.

### Task 9: Rollout

- [ ] **Step 1:** `npm run draft:local -- expressjs`; check the draft in `/admin/topik/expressjs` (chapter lengths, exercises kept). Fix prompt issues before importing more.
- [ ] **Step 2:** Import the 8 topics without chapters, then the 5 thin ones (`draft:local`, one at a time). Re-add the hand-written Express exercise on nodejs or retarget the e2e before nodejs is republished.
- [ ] **Step 3:** Publishing stays with the owner; report which drafts are ready.
