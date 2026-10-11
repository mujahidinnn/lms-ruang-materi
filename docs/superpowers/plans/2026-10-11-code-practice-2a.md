# Code Practice Phase 2a (web, js, express) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Learners write HTML/CSS/JS, plain JavaScript and Express route code inside a chapter, run it, and pass automatic checks, with results recorded and counted toward the chapter.

**Architecture:** Exercises are content rows under chapters. Learner code and every check run in a sandboxed iframe (`sandbox="allow-scripts"`, no same-origin) built from a pure document builder; results come back over `postMessage` with a nonce. A pure mini-Express shim serves both the iframe (as source text) and the worker (in `node:vm`), which validates AI-drafted solutions before saving.

**Tech Stack:** Next.js 16, Supabase Postgres + RLS + pgTAP, CodeMirror 6, Vitest, Playwright, zod, node:vm.

**Spec:** `docs/superpowers/specs/2026-10-11-code-practice-design.md` (phase 2a only: kinds `web`, `js`, `express`; the enum already lists `sql` and `git` for 2b/2c).

## Global Constraints

- Learner code never runs on our servers; in the browser it runs only inside the sandbox iframe, and checks are evaluated inside the same iframe.
- Each run has a 3 s limit; on timeout the iframe is removed and the result is "Kode berjalan terlalu lama".
- Exercise tests are `[{ name: string, check: string }]`; `check` is a JS expression (may use `await`) that must evaluate to `true`.
- `starter`/`solution` shape: `web` → `{ html, css, js }`; `js`/`express` → `{ code }`.
- 0 to 2 exercises per chapter from the AI; an exercise whose solution fails its own tests in the worker is dropped (web is not executed in the worker).
- UI in Bahasa Indonesia, pastel primitives from `components/ui/styles.ts`; code comments in English.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- A learner's infinite loop (`while(true){}`) must stop after 3 s with a clear message and leave the page usable.
- Code containing `</script>` or backticks must not break out of the sandbox document.
- A check that throws (e.g. calls an undefined function) must show as a failed check with its error, not crash the runner.
- A guest who passes an exercise sees "Lolos" and a sign-in hint, with no write attempt.
- A chapter with exercises must not complete from the quiz alone; the learner gets a clear message to finish the code exercises.

---

### Task 1: Tables, RPC and the chapter rule

**Files:**
- Create: `supabase/migrations/20261011040000_code_exercises.sql`
- Modify: `supabase/tests/security_smoke.sql`

**Interfaces:**
- Produces: `public.code_exercises(id, chapter_id, position, kind, title, prompt, starter jsonb, solution jsonb, setup text, tests jsonb, updated_by, created_at)`, enum `public.code_kind ('web','js','express','sql','git')`, `public.code_progress(user_id, exercise_id, passed_at, code jsonb)`, `public.pass_code_exercise(p_exercise uuid, p_code jsonb) returns void`, `complete_chapter` now requires all exercises passed.

- [ ] **Step 1: Failing smoke tests** (append before `select * from finish();`, bump `plan` by 5)

```sql
-- Code exercises (2026-10-11).
insert into public.code_exercises (id, chapter_id, position, kind, title, prompt, starter, solution, tests) values
  ('70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002', 0, 'js', 'Jumlah', 'Buat fungsi jumlah.',
   '{"code": ""}', '{"code": "function jumlah(a, b) { return a + b }"}', '[{"name": "2 + 3 = 5", "check": "jumlah(2, 3) === 5"}]'),
  ('70000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000003', 0, 'js', 'Draf', 'x',
   '{"code": ""}', '{"code": ""}', '[]');
set local role anon;
select is((select count(*)::int from public.code_exercises), 1, 'anon sees exercises of published chapters only');
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated"}';
select throws_ok($$ select public.complete_chapter('60000000-0000-0000-0000-000000000002') $$,
  'P0001', 'Selesaikan latihan kode di bab ini dulu', 'a chapter with exercises needs them passed first');
select throws_ok($$ insert into public.code_progress (user_id, exercise_id) values (auth.uid(), '70000000-0000-0000-0000-000000000001') $$,
  '42501', null, 'learners cannot write code progress directly');
select lives_ok($$ select public.pass_code_exercise('70000000-0000-0000-0000-000000000001', '{"code": "x"}') $$, 'a learner passes an exercise');
select lives_ok($$ select public.complete_chapter('60000000-0000-0000-0000-000000000002') $$, 'then the chapter completes');
reset role;
```

Run: `npx supabase test db` → Expected: FAIL (relation code_exercises does not exist).

- [ ] **Step 2: Migration**

```sql
-- Code exercises inside chapters (spec 2026-10-11-code-practice). Learner
-- code runs in the browser sandbox; the database only stores exercises
-- and who passed which.

create type public.code_kind as enum ('web', 'js', 'express', 'sql', 'git');

create table public.code_exercises (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  position int not null default 0,
  kind public.code_kind not null,
  title text not null check (char_length(title) between 1 and 120),
  prompt text not null,
  starter jsonb not null default '{}',
  solution jsonb not null default '{}',
  setup text not null default '',
  tests jsonb not null default '[]' check (jsonb_typeof(tests) = 'array'),
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.code_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.code_exercises (id) on delete cascade,
  passed_at timestamptz not null default now(),
  code jsonb not null default '{}',
  primary key (user_id, exercise_id)
);

create index on public.code_exercises (chapter_id);
create index on public.code_exercises (updated_by) where updated_by is not null;
create index on public.code_progress (exercise_id);

alter table public.code_exercises enable row level security;
alter table public.code_progress enable row level security;

create trigger set_updated_by before insert or update on public.code_exercises
  for each row execute function public.set_updated_by();

create policy "code_exercises: admin all" on public.code_exercises for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "code_exercises: read published" on public.code_exercises for select to anon, authenticated
  using (chapter_id in (
    select c.id from public.chapters c join public.topics t on t.id = c.topic_id
    where c.status = 'published' and t.status = 'published'));
create policy "code_progress: read own or admin" on public.code_progress for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create trigger require_consent before insert on public.code_progress
  for each row execute function public.require_consent();
create trigger log_learning_day after insert or update of passed_at on public.code_progress
  for each row execute function public.log_learning_day();

-- Records a pass (checks run in the browser, like practice keys).
create or replace function public.pass_code_exercise(p_exercise uuid, p_code jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Masuk dulu' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.code_exercises e
    join public.chapters c on c.id = e.chapter_id and c.status = 'published'
    join public.topics t on t.id = c.topic_id and t.status = 'published'
    where e.id = p_exercise
  ) then
    raise exception 'Latihan tidak ditemukan' using errcode = 'P0002';
  end if;
  insert into public.code_progress (user_id, exercise_id, code) values (uid, p_exercise, coalesce(p_code, '{}'))
  on conflict (user_id, exercise_id) do update set code = excluded.code, passed_at = now();
end;
$$;

revoke execute on function public.pass_code_exercise(uuid, jsonb) from public, anon;
grant execute on function public.pass_code_exercise(uuid, jsonb) to authenticated;

-- complete_chapter again: a chapter with exercises needs them all passed.
create or replace function public.complete_chapter(p_chapter uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.code_exercises e
    where e.chapter_id = p_chapter
      and not exists (select 1 from public.code_progress p where p.exercise_id = e.id and p.user_id = auth.uid())
  ) then
    raise exception 'Selesaikan latihan kode di bab ini dulu' using errcode = 'P0001';
  end if;
  perform public.open_chapter(p_chapter);
  insert into public.chapter_progress (user_id, chapter_id)
  values (auth.uid(), p_chapter)
  on conflict do nothing;
end;
$$;
```

- [ ] **Step 3: Run** `npx supabase db reset && npx supabase test db` → Expected: `Result: PASS`.

- [ ] **Step 4: Commit** `git add supabase && git commit -m "Code exercises, progress and the chapter rule"`

---

### Task 2: Mini-Express shim and the Node check runner

**Files:**
- Create: `lib/code/express-shim.ts`, `lib/code/check-node.ts`, `lib/code/code.test.ts`

**Interfaces:**
- Produces:
  - `export function expressShim(): { require: (name: string) => unknown; request: (method: string, path: string, body?: unknown) => Promise<{ status: number; body: unknown }>; module: { exports: unknown } }` — pure, no imports, no closures over module scope (its `toString()` is injected into the iframe).
  - `export type Check = { name: string; check: string }`, `export type CheckResult = { name: string; pass: boolean; error?: string }`.
  - `export async function runChecksNode(input: { kind: "js" | "express"; code: string; setup: string; tests: Check[] }): Promise<{ results: CheckResult[]; error?: string }>` (worker-side validation with `node:vm`, 3 s timeout).

- [ ] **Step 1: Failing tests** (`lib/code/code.test.ts`)

```ts
import { expect, test } from "vitest";
import { runChecksNode } from "./check-node";
import { expressShim } from "./express-shim";

test("shim routes params, query and json bodies", async () => {
  const { require, request } = expressShim();
  const express = require("express") as () => any;
  const app = express();
  app.use((express as any).json());
  app.get("/produk/:id", (req: any, res: any) => res.json({ id: req.params.id, q: req.query.q }));
  app.post("/produk", (req: any, res: any) => res.status(201).json(req.body));
  expect(await request("GET", "/produk/7?q=a")).toEqual({ status: 200, body: { id: "7", q: "a" } });
  expect(await request("POST", "/produk", { nama: "x" })).toEqual({ status: 201, body: { nama: "x" } });
  expect((await request("GET", "/tidak-ada")).status).toBe(404);
});

test("runChecksNode passes a right solution and fails a wrong one", async () => {
  const tests = [{ name: "2+3", check: "jumlah(2, 3) === 5" }];
  const ok = await runChecksNode({ kind: "js", code: "function jumlah(a, b) { return a + b }", setup: "", tests });
  expect(ok.results).toEqual([{ name: "2+3", pass: true }]);
  const bad = await runChecksNode({ kind: "js", code: "function jumlah(a, b) { return a - b }", setup: "", tests });
  expect(bad.results[0].pass).toBe(false);
});

test("a throwing check is a failed check with its error", async () => {
  const r = await runChecksNode({ kind: "js", code: "", setup: "", tests: [{ name: "x", check: "tidakAda() === 1" }] });
  expect(r.results[0]).toMatchObject({ name: "x", pass: false });
  expect(r.results[0].error).toMatch(/tidakAda/);
});

test("express checks can await request()", async () => {
  const code = "const express = require('express'); const app = express(); app.get('/halo', (req, res) => res.send('hai')); app.listen(3000);";
  const r = await runChecksNode({ kind: "express", code, setup: "", tests: [{ name: "GET /halo", check: "(await request('GET', '/halo')).body === 'hai'" }] });
  expect(r.results[0].pass).toBe(true);
});

test("an infinite loop is stopped", async () => {
  const r = await runChecksNode({ kind: "js", code: "while (true) {}", setup: "", tests: [] });
  expect(r.error).toMatch(/terlalu lama/);
});
```

Run: `npx vitest run lib/code/code.test.ts` → Expected: FAIL (modules missing).

- [ ] **Step 2: Shim**

```ts
// A tiny Express for exercises: enough of app/req/res to write and test
// route handlers. Self-contained (no imports, no outer references) so its
// source can be injected into the browser sandbox as text.
export function expressShim() {
  type Handler = (req: any, res: any, next: () => void) => unknown;
  const routes: { method: string; parts: string[]; handlers: Handler[] }[] = [];
  const middleware: Handler[] = [];
  const split = (p: string) => p.split("/").filter(Boolean);

  function express() {
    const app: any = {
      use: (fn: Handler) => (middleware.push(fn), app),
      listen: (_port?: number, cb?: () => void) => (cb?.(), app),
    };
    for (const m of ["get", "post", "put", "patch", "delete"]) {
      app[m] = (path: string, ...handlers: Handler[]) => (routes.push({ method: m.toUpperCase(), parts: split(path), handlers }), app);
    }
    return app;
  }
  (express as any).json = () => (_req: any, _res: any, next: () => void) => next();
  (express as any).Router = express;

  async function request(method: string, path: string, body?: unknown) {
    const [pathname, search = ""] = path.split("?");
    const query = Object.fromEntries(new URLSearchParams(search));
    const parts = split(pathname);
    let status = 200;
    let sent: unknown;
    let done = false;
    const res: any = {
      status: (s: number) => ((status = s), res),
      json: (v: unknown) => ((sent = v), (done = true), res),
      send: (v: unknown) => ((sent = v), (done = true), res),
      sendStatus: (s: number) => ((status = s), (sent = String(s)), (done = true), res),
      end: () => ((done = true), res),
    };
    for (const r of routes) {
      if (r.method !== method.toUpperCase() || r.parts.length !== parts.length) continue;
      const params: Record<string, string> = {};
      const match = r.parts.every((p, i) => (p.startsWith(":") ? ((params[p.slice(1)] = decodeURIComponent(parts[i])), true) : p === parts[i]));
      if (!match) continue;
      const req = { method: method.toUpperCase(), path: pathname, params, query, body: body ?? {}, headers: {} };
      const chain = [...middleware, ...r.handlers];
      for (let i = 0; i < chain.length && !done; i++) {
        let called = false;
        await chain[i](req, res, () => (called = true));
        if (!called && !done) break;
      }
      return { status, body: sent };
    }
    return { status: 404, body: "Not Found" };
  }

  const module = { exports: {} as unknown };
  const require = (name: string) => {
    if (name === "express") return express;
    throw new Error(`Modul ${name} tidak tersedia di latihan ini`);
  };
  return { require, request, module };
}
```

- [ ] **Step 3: Node runner**

```ts
import vm from "node:vm";
import { expressShim } from "./express-shim";

export type Check = { name: string; check: string };
export type CheckResult = { name: string; pass: boolean; error?: string };

// Worker-side validation of drafted solutions (js, express). Learner code
// never reaches this; it runs only in the browser sandbox.
export async function runChecksNode(input: { kind: "js" | "express"; code: string; setup: string; tests: Check[] }): Promise<{ results: CheckResult[]; error?: string }> {
  const ctx = vm.createContext({ console: { log() {}, error() {}, warn() {} }, ...(input.kind === "express" ? expressShim() : {}) });
  try {
    vm.runInContext(`${input.setup}\n${input.code}`, ctx, { timeout: 3000 });
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    return { results: [], error: /timed out/i.test(msg) ? "Kode berjalan terlalu lama" : msg };
  }
  const results: CheckResult[] = [];
  for (const t of input.tests) {
    try {
      const run = vm.runInContext(`(async () => (${t.check}))()`, ctx, { timeout: 3000 }) as Promise<unknown>;
      const value = await Promise.race([run, new Promise((_, no) => setTimeout(() => no(new Error("Kode berjalan terlalu lama")), 3000))]);
      results.push(value === true ? { name: t.name, pass: true } : { name: t.name, pass: false });
    } catch (e) {
      results.push({ name: t.name, pass: false, error: (e as Error).message ?? String(e) });
    }
  }
  return { results };
}
```

Note: function declarations in the learner code become context globals, so checks can call them.

- [ ] **Step 4: Run** `npx vitest run lib/code/code.test.ts` → Expected: PASS (5 tests).

- [ ] **Step 5: Commit** `git add lib/code && git commit -m "Mini-Express shim and Node check runner for exercise validation"`

---

### Task 3: Sandbox document builder

**Files:**
- Create: `lib/code/sandbox-doc.ts`; Modify: `lib/code/code.test.ts`

**Interfaces:**
- Consumes: `expressShim` (Task 2), `Check` (Task 2).
- Produces: `export type ExerciseFiles = { html?: string; css?: string; js?: string; code?: string }`; `export function buildSandboxDoc(input: { kind: "web" | "js" | "express"; files: ExerciseFiles; setup: string; tests: Check[]; nonce: string }): string` — a full HTML document whose script posts `{ nonce, logs: string[], results: CheckResult[], error?: string }` to `parent` when done.

- [ ] **Step 1: Failing tests** (append)

```ts
import { buildSandboxDoc } from "./sandbox-doc";

test("the sandbox document cannot be broken out of by </script>", () => {
  const doc = buildSandboxDoc({ kind: "js", files: { code: "const s = '</script><script>alert(1)</script>';" }, setup: "", tests: [], nonce: "n1" });
  expect(doc.match(/<\/script>/g)).toHaveLength(1); // only the harness's own closing tag
  expect(doc).toContain('"n1"');
});

test("web documents carry the learner's html and css", () => {
  const doc = buildSandboxDoc({ kind: "web", files: { html: "<h1>Halo</h1>", css: "h1{color:red}", js: "" }, setup: "", tests: [], nonce: "n2" });
  expect(doc).toContain("<h1>Halo</h1>");
  expect(doc).toContain("h1{color:red}");
});
```

Run: `npx vitest run lib/code/code.test.ts` → Expected: FAIL (module missing).

- [ ] **Step 2: Implement**

```ts
import type { Check } from "./check-node";
import { expressShim } from "./express-shim";

export type ExerciseFiles = { html?: string; css?: string; js?: string; code?: string };

// JSON for embedding in a <script>: "<" escaped so no "</script>" can close
// the harness early.
const embed = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");

// The harness: capture console, run setup + learner code with indirect eval
// (globals stay global, syntax errors are caught), then each check, and post
// the results to the parent with the run's nonce.
function harness(code: string, setup: string, tests: Check[], nonce: string, shim: boolean) {
  return `<script>
(async () => {
  const logs = [];
  const fmt = (v) => typeof v === "string" ? v : (() => { try { return JSON.stringify(v); } catch { return String(v); } })();
  console.log = console.info = console.warn = console.error = (...a) => logs.push(a.map(fmt).join(" "));
  const post = (m) => parent.postMessage({ nonce: ${embed(nonce)}, logs, ...m }, "*");
  ${shim ? `const { require, request, module } = (${expressShim.toString()})(); Object.assign(window, { require, request, module });` : ""}
  try {
    (0, eval)(${embed(setup)});
    (0, eval)(${embed(code)});
  } catch (e) {
    return post({ results: [], error: String(e && e.message || e) });
  }
  const results = [];
  for (const t of ${embed(tests)}) {
    try {
      const v = await (0, eval)("(async () => (" + t.check + "))()");
      results.push(v === true ? { name: t.name, pass: true } : { name: t.name, pass: false });
    } catch (e) {
      results.push({ name: t.name, pass: false, error: String(e && e.message || e) });
    }
  }
  post({ results });
})();
</script>`;
}

export function buildSandboxDoc(input: { kind: "web" | "js" | "express"; files: ExerciseFiles; setup: string; tests: Check[]; nonce: string }): string {
  const { kind, files, setup, tests, nonce } = input;
  if (kind === "web") {
    return `<!doctype html><html><head><meta charset="utf-8"><style>${(files.css ?? "").replace(/<\/style/gi, "<\\/style")}</style></head><body>${files.html ?? ""}${harness(files.js ?? "", setup, tests, nonce, false)}</body></html>`;
  }
  return `<!doctype html><html><head><meta charset="utf-8"></head><body>${harness(files.code ?? "", setup, tests, nonce, kind === "express")}</body></html>`;
}
```

Note on the web kind: learner HTML is placed as-is (it is the learner's own page, inside the sandbox). A learner's `</script>` inside their HTML only affects their own document.

Update the first test accordingly: for `js` the doc contains exactly one `</script>`.

- [ ] **Step 3: Run** `npx vitest run lib/code/code.test.ts` → Expected: PASS.

- [ ] **Step 4: Commit** `git add lib/code && git commit -m "Sandbox document builder with escaped embedding"`

---

### Task 4: Runner hook and CodeMirror editor

**Files:**
- Create: `components/code/useSandbox.ts`, `components/code/CodeEditor.tsx`
- Modify: `package.json` (CodeMirror deps)

**Interfaces:**
- Consumes: `buildSandboxDoc`, `ExerciseFiles` (Task 3), `CheckResult` (Task 2).
- Produces:
  - `export type RunResult = { logs: string[]; results: CheckResult[]; error?: string }`
  - `useSandbox(): { run(input: { kind: "web" | "js" | "express"; files: ExerciseFiles; setup: string; tests: Check[]; previewEl?: HTMLIFrameElement | null }): Promise<RunResult> }`
  - `CodeEditor({ value, onChange, language, label }: { value: string; onChange(v: string): void; language: "html" | "css" | "javascript"; label: string })` (default export, client, lazy-loaded with `next/dynamic`, `ssr: false`).

- [ ] **Step 1: Install** `npm install codemirror@6.0.2 @codemirror/lang-html@6.4.12 @codemirror/lang-css@6.3.1 @codemirror/lang-javascript@6.2.5 @codemirror/state@6.7.6 @codemirror/view@6.43.14`

- [ ] **Step 2: useSandbox**

```ts
"use client";

import { useCallback } from "react";
import type { Check, CheckResult } from "@/lib/code/check-node";
import { buildSandboxDoc, type ExerciseFiles } from "@/lib/code/sandbox-doc";

export type RunResult = { logs: string[]; results: CheckResult[]; error?: string };

// Runs one exercise in a sandboxed iframe (scripts only, no same-origin).
// For web exercises the visible preview iframe is reused; otherwise a hidden
// one is created and removed. A run that takes over 3 s is cut off.
export function useSandbox() {
  const run = useCallback(
    (input: { kind: "web" | "js" | "express"; files: ExerciseFiles; setup: string; tests: Check[]; previewEl?: HTMLIFrameElement | null }) =>
      new Promise<RunResult>((resolve) => {
        const nonce = crypto.randomUUID();
        const frame = input.previewEl ?? document.createElement("iframe");
        const own = !input.previewEl;
        frame.setAttribute("sandbox", "allow-scripts");
        if (own) {
          frame.hidden = true;
          document.body.appendChild(frame);
        }
        const finish = (r: RunResult) => {
          clearTimeout(timer);
          window.removeEventListener("message", onMessage);
          if (own) frame.remove();
          resolve(r);
        };
        const onMessage = (e: MessageEvent) => {
          if (e.source !== frame.contentWindow || e.data?.nonce !== nonce) return;
          finish({ logs: e.data.logs ?? [], results: e.data.results ?? [], error: e.data.error });
        };
        const timer = setTimeout(() => {
          frame.srcdoc = "";
          finish({ logs: [], results: [], error: "Kode berjalan terlalu lama" });
        }, 3000);
        window.addEventListener("message", onMessage);
        frame.srcdoc = buildSandboxDoc({ kind: input.kind, files: input.files, setup: input.setup, tests: input.tests, nonce });
      }),
    []
  );
  return { run };
}
```

- [ ] **Step 3: CodeEditor**

```tsx
"use client";

import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView, basicSetup } from "codemirror";
import { useEffect, useRef } from "react";

const LANG = { html, css, javascript };

// CodeMirror 6, uncontrolled after mount: the parent's value seeds it and
// every edit is reported back through onChange.
export default function CodeEditor({ value, onChange, language, label }: { value: string; onChange: (v: string) => void; language: keyof typeof LANG; label: string }) {
  const host = useRef<HTMLDivElement>(null);
  const changed = useRef(onChange);
  changed.current = onChange;

  useEffect(() => {
    const view = new EditorView({
      doc: value,
      parent: host.current!,
      extensions: [
        basicSetup,
        LANG[language](),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({ "aria-label": label }),
        EditorView.updateListener.of((u) => u.docChanged && changed.current(u.state.doc.toString())),
      ],
    });
    return () => view.destroy();
    // Recreated only when the language changes; value is the seed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  return <div ref={host} className="code-editor overflow-hidden rounded-2xl bg-zinc-900 text-sm shadow-soft" />;
}
```

Add to `app/globals.css`:

```css
/* CodeMirror inside the pastel card. */
.code-editor .cm-editor { background: transparent; min-height: 10rem; max-height: 28rem; }
.code-editor .cm-scroller { font-family: var(--font-mono); }
.code-editor .cm-gutters { background: transparent; border: none; color: var(--color-zinc-600); }
.code-editor .cm-focused { outline: none; }
```

- [ ] **Step 4: Verify** `npx tsc --noEmit -p . && npx eslint components/code` → clean.

- [ ] **Step 5: Commit** `git add package.json package-lock.json components/code app/globals.css && git commit -m "Sandbox runner hook and CodeMirror editor"`

---

### Task 5: Exercise card in chapters

**Files:**
- Create: `components/code/CodeExercise.tsx`
- Modify: `lib/content.ts` (`Chapter.exercises`), `app/belajar/[slug]/[bab]/page.tsx`, `components/belajar/ChapterQuiz.tsx` (show P0001 message)

**Interfaces:**
- Consumes: `useSandbox`, `RunResult` (Task 4), `CodeEditor` (Task 4), feedback (`lib/feedback.ts`).
- Produces: `export type CodeExerciseData = { id: string; kind: "web" | "js" | "express"; title: string; prompt: string; starter: ExerciseFiles; solution: ExerciseFiles; setup: string; tests: Check[] }`; `Chapter` gains `exercises: CodeExerciseData[]`.

- [ ] **Step 1: Loader** — in `getChapter`, append to the select `, code_exercises(id, position, kind, title, prompt, starter, solution, setup, tests)`, add the field to `ChapterRow`, and map:

```ts
    exercises: (c.code_exercises ?? [])
      .filter((e) => e.kind === "web" || e.kind === "js" || e.kind === "express")
      .toSorted((a, b) => a.position - b.position)
      .map((e) => ({ id: e.id, kind: e.kind, title: e.title, prompt: e.prompt, starter: e.starter, solution: e.solution, setup: e.setup, tests: e.tests })),
```

with `CodeExerciseData` exported from `lib/content.ts` (importing `Check` and `ExerciseFiles` types from `lib/code`).

- [ ] **Step 2: CodeExercise component**

```tsx
"use client";

import { Check as CheckIcon, Eye, Play, RotateCcw, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSandbox, type RunResult } from "@/components/code/useSandbox";
import ChapterMarkdown from "@/components/belajar/MarkdownBase";
import { card, primaryButton, secondaryButton } from "@/components/ui/styles";
import type { CodeExerciseData } from "@/lib/content";
import { burstFrom, celebrate, playCorrect, playWrong } from "@/lib/feedback";
import type { ExerciseFiles } from "@/lib/code/sandbox-doc";
import { createClient } from "@/lib/supabase/client";

const CodeEditor = dynamic(() => import("@/components/code/CodeEditor"), {
  ssr: false,
  loading: () => <div className="h-40 animate-pulse rounded-2xl bg-zinc-800/60" />,
});

const TABS = { web: ["html", "css", "js"], js: ["code"], express: ["code"] } as const;
const LANG = { html: "html", css: "css", js: "javascript", code: "javascript" } as const;
const LABEL = { html: "HTML", css: "CSS", js: "JS", code: "Kode" } as const;

// One exercise: prompt, editor, Jalankan (output only) and Periksa (checks).
// Draft code stays in localStorage; a pass is recorded for signed-in
// learners and opens the chapter's completion.
export default function CodeExercise({ ex, slug, onPassed }: { ex: CodeExerciseData; slug: string; onPassed: (id: string) => void }) {
  const key = `ruang-materi:kode:${ex.id}`;
  const [files, setFiles] = useState<ExerciseFiles>(ex.starter);
  const [tab, setTab] = useState<keyof typeof LANG>(TABS[ex.kind][0]);
  const [out, setOut] = useState<RunResult | null>(null);
  const [fails, setFails] = useState(0);
  const [passed, setPassed] = useState(false);
  const [guest, setGuest] = useState(false);
  const [busy, setBusy] = useState(false);
  const preview = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const { run } = useSandbox();

  useEffect(() => {
    // Restore a draft, or the learner's passing code, after mount.
    try {
      const saved = localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setFiles(JSON.parse(saved));
    } catch {}
    const db = createClient();
    db.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: row } = await db.from("code_progress").select("code").eq("user_id", data.session.user.id).eq("exercise_id", ex.id).maybeSingle();
      if (row) {
        setPassed(true);
        onPassed(ex.id);
        if (!localStorage.getItem(key)) setFiles(row.code as ExerciseFiles);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex.id]);

  function edit(part: keyof ExerciseFiles, v: string) {
    const next = { ...files, [part]: v };
    setFiles(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  }

  async function go(withChecks: boolean) {
    setBusy(true);
    const r = await run({ kind: ex.kind, files, setup: ex.setup, tests: withChecks ? ex.tests : [], previewEl: ex.kind === "web" ? preview.current : null });
    setOut(r);
    setBusy(false);
    if (!withChecks) return;
    const ok = !r.error && r.results.length === ex.tests.length && r.results.every((x) => x.pass);
    if (!ok) {
      playWrong();
      setFails((f) => f + 1);
      return;
    }
    playCorrect();
    burstFrom(box.current);
    if (!passed) celebrate();
    setPassed(true);
    onPassed(ex.id);
    const db = createClient();
    const { data } = await db.auth.getSession();
    if (!data.session) return setGuest(true);
    await db.rpc("pass_code_exercise", { p_exercise: ex.id, p_code: files });
  }

  return (
    <section ref={box} aria-labelledby={`kode-${ex.id}`} className={`mt-10 p-5 sm:p-7 ${card}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`kode-${ex.id}`} className="text-2xl font-bold tracking-tight">Latihan kode: {ex.title}</h2>
        {passed && <span className="inline-flex min-h-8 items-center gap-1 rounded-full bg-tile-mint px-3 text-sm font-semibold"><CheckIcon aria-hidden className="size-4" />Lolos</span>}
      </div>
      <div className="mt-3"><ChapterMarkdown body={ex.prompt} slides={[]} /></div>

      {TABS[ex.kind].length > 1 && (
        <div role="tablist" aria-label="Berkas" className="mt-4 flex gap-2">
          {TABS[ex.kind].map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`min-h-10 rounded-full px-4 text-sm font-medium ${tab === t ? "bg-zinc-50 text-zinc-950" : "bg-zinc-800 text-zinc-400"}`}>
              {LABEL[t]}
            </button>
          ))}
        </div>
      )}
      <div className="mt-3">
        <CodeEditor key={tab} value={files[tab] ?? ""} onChange={(v) => edit(tab, v)} language={LANG[tab]} label={`Editor ${LABEL[tab]}`} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => go(false)} disabled={busy} className={secondaryButton}><Play aria-hidden className="size-4" />Jalankan</button>
        <button onClick={() => go(true)} disabled={busy} className={primaryButton}><CheckIcon aria-hidden className="size-4" />Periksa</button>
        <button onClick={() => { setFiles(ex.starter); try { localStorage.removeItem(key); } catch {} }} className={secondaryButton}><RotateCcw aria-hidden className="size-4" />Reset kode</button>
        {fails >= 2 && (
          <button onClick={() => { setFiles(ex.solution); setTab(TABS[ex.kind][0]); }} className={secondaryButton}><Eye aria-hidden className="size-4" />Lihat solusi</button>
        )}
      </div>

      {ex.kind === "web" && (
        <iframe ref={preview} title={`Pratinjau ${ex.title}`} sandbox="allow-scripts" className="mt-4 h-64 w-full rounded-2xl bg-white shadow-soft" />
      )}

      <div aria-live="polite" className="mt-4 space-y-3 empty:hidden">
        {out?.error && <p className="rounded-2xl bg-tile-pink px-4 py-3 text-sm"><span className="font-semibold">Galat:</span> {out.error}</p>}
        {out && out.logs.length > 0 && (
          <pre className="scrollbar-thin max-h-48 overflow-auto rounded-2xl bg-zinc-800/60 p-4 text-sm"><code className="font-mono">{out.logs.join("\n")}</code></pre>
        )}
        {out && out.results.length > 0 && (
          <ul className="space-y-2">
            {out.results.map((r) => (
              <li key={r.name} className={`flex items-start gap-2 rounded-2xl px-4 py-3 text-sm ${r.pass ? "bg-tile-mint" : "bg-tile-pink"}`}>
                {r.pass ? <CheckIcon aria-label="lolos" className="mt-0.5 size-4 shrink-0" /> : <X aria-label="gagal" className="mt-0.5 size-4 shrink-0" />}
                <span><span className="font-medium">{r.name}</span>{r.error && <span className="block text-zinc-300">{r.error}</span>}</span>
              </li>
            ))}
          </ul>
        )}
        {guest && (
          <p className="text-sm text-zinc-400"><Link href={`/masuk?next=/belajar/${slug}`} className="text-accent underline">Masuk untuk menyimpan progres</Link></p>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Chapter page** — in `app/belajar/[slug]/[bab]/page.tsx`, render exercises between the markdown and the quiz via a small client wrapper `components/code/ChapterExercises.tsx`:

```tsx
"use client";

import { useState } from "react";
import CodeExercise from "@/components/code/CodeExercise";
import type { CodeExerciseData } from "@/lib/content";

// Tracks which exercises passed, so the quiz knows when the chapter can finish.
export default function ChapterExercises({ exercises, slug, children }: { exercises: CodeExerciseData[]; slug: string; children: (allPassed: boolean) => React.ReactNode }) {
  const [passed, setPassed] = useState<Set<string>>(new Set());
  const mark = (id: string) => setPassed((p) => (p.has(id) ? p : new Set(p).add(id)));
  return (
    <>
      {exercises.map((ex) => <CodeExercise key={ex.id} ex={ex} slug={slug} onPassed={mark} />)}
      {children(exercises.every((e) => passed.has(e.id)))}
    </>
  );
}
```

Because a render-prop child cannot be passed from a server component, instead add an `exercises` prop to `ChapterQuiz` and render `ChapterExercises` inside `ChapterQuiz` (both client). Concretely: `ChapterQuiz` gains `exercises: CodeExerciseData[]`; it keeps `const [passedEx, setPassedEx] = useState<Set<string>>(new Set())`, renders `{exercises.map((ex) => <CodeExercise key={ex.id} ex={ex} slug={slug} onPassed={(id) => setPassedEx((p) => p.has(id) ? p : new Set(p).add(id))} />)}` above its quiz section, and only calls `complete()` when `exercises.every((e) => passedEx.has(e.id))`; otherwise, after the quiz is all correct, it shows "Kuis beres. Selesaikan latihan kode di atas untuk menyelesaikan bab ini." Delete `ChapterExercises.tsx` from this step (not needed). The page passes `exercises={chapter.exercises}`.

Also in `ChapterQuiz` `complete()`: when the RPC returns `error.code === "P0001"`, show `error.message` instead of the consent hint.

- [ ] **Step 4: Verify** `npx tsc --noEmit -p . && npx eslint components app lib && npx vitest run` → clean, all pass.

- [ ] **Step 5: Commit** `git add components lib app && git commit -m "Code exercises in chapters: editor, run, checks, pass"`

---

### Task 6: Admin exercise editor

**Files:**
- Create: `components/admin/ExerciseEditor.tsx`, `app/admin/topik/exercise-actions.ts`
- Modify: `app/admin/topik/[slug]/page.tsx`

**Interfaces:**
- Consumes: `useSandbox` (Task 4), `CodeExerciseData` (Task 5).
- Produces: actions `simpanLatihanKode(form)`, `tambahLatihanKode(form)`, `hapusLatihanKode(form)`.

- [ ] **Step 1: Actions**

```ts
"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const json = (schema: z.ZodType) => z.string().transform((s, ctx) => {
  try {
    return schema.parse(JSON.parse(s));
  } catch {
    ctx.addIssue({ code: "custom", message: "JSON tidak valid" });
    return z.NEVER;
  }
});
const files = z.object({ html: z.string().optional(), css: z.string().optional(), js: z.string().optional(), code: z.string().optional() });
const tests = z.array(z.object({ name: z.string().min(1), check: z.string().min(1) }));

function done(topic: string) {
  updateTag("content");
  revalidatePath(`/admin/topik/${topic}`);
}

export async function simpanLatihanKode(form: FormData) {
  await requireAdmin();
  const f = z
    .object({
      id: z.uuid(), topic: z.string(), title: z.string().trim().min(1).max(120), kind: z.enum(["web", "js", "express"]),
      prompt: z.string().min(1), starter: json(files), solution: json(files), setup: z.string(), tests: json(tests),
    })
    .parse(Object.fromEntries(form));
  const { id, topic, ...row } = f;
  const { error } = await (await createClient()).from("code_exercises").update(row).eq("id", id);
  if (error) throw new Error(error.message);
  done(topic);
}

export async function tambahLatihanKode(form: FormData) {
  await requireAdmin();
  const { chapter, topic } = z.object({ chapter: z.uuid(), topic: z.string() }).parse(Object.fromEntries(form));
  const { error } = await (await createClient()).from("code_exercises").insert({
    chapter_id: chapter, kind: "js", title: "Latihan baru", prompt: "Tulis instruksinya di sini.",
    starter: { code: "" }, solution: { code: "" }, tests: [],
  });
  if (error) throw new Error(error.message);
  done(topic);
}

export async function hapusLatihanKode(form: FormData) {
  await requireAdmin();
  const { id, topic } = z.object({ id: z.uuid(), topic: z.string() }).parse(Object.fromEntries(form));
  const { error } = await (await createClient()).from("code_exercises").delete().eq("id", id);
  if (error) throw new Error(error.message);
  done(topic);
}
```

- [ ] **Step 2: ExerciseEditor** (client) — fields: title, kind select (web/js/express), prompt textarea, starter/solution/tests JSON textareas (monospace, `JSON.stringify(v, null, 2)` defaults), setup textarea; buttons "Simpan latihan" (form action `simpanLatihanKode`), "Uji solusi" (runs `useSandbox().run({ kind, files: JSON.parse(solution), setup, tests: JSON.parse(tests) })` and lists results with the same mint/pink rows as the learner card), "Hapus latihan" (`hapusLatihanKode`, confirm). Invalid JSON in "Uji solusi" shows "JSON tidak valid" in a pink row.

```tsx
"use client";

import { FlaskConical, Trash2 } from "lucide-react";
import { useState } from "react";
import { hapusLatihanKode, simpanLatihanKode } from "@/app/admin/topik/exercise-actions";
import { useSandbox, type RunResult } from "@/components/code/useSandbox";
import { dangerButton, field, smallButton } from "./editor";

export type ExerciseRow = { id: string; kind: "web" | "js" | "express"; title: string; prompt: string; starter: object; solution: object; setup: string; tests: { name: string; check: string }[] };

export default function ExerciseEditor({ topic, ex }: { topic: string; ex: ExerciseRow }) {
  const [kind, setKind] = useState(ex.kind);
  const [solution, setSolution] = useState(JSON.stringify(ex.solution, null, 2));
  const [tests, setTests] = useState(JSON.stringify(ex.tests, null, 2));
  const [setup, setSetup] = useState(ex.setup);
  const [out, setOut] = useState<RunResult | null>(null);
  const { run } = useSandbox();

  async function uji() {
    try {
      setOut(await run({ kind, files: JSON.parse(solution), setup, tests: JSON.parse(tests) }));
    } catch {
      setOut({ logs: [], results: [], error: "JSON tidak valid" });
    }
  }

  return (
    <li className="py-5">
      <form action={simpanLatihanKode} className="grid gap-3">
        <input type="hidden" name="id" value={ex.id} />
        <input type="hidden" name="topic" value={topic} />
        <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
          <label className="text-sm text-zinc-400">Judul<input name="title" defaultValue={ex.title} required className={`${field} mt-1`} /></label>
          <label className="text-sm text-zinc-400">Jenis
            <select name="kind" value={kind} onChange={(e) => setKind(e.target.value as ExerciseRow["kind"])} className={`${field} mt-1`}>
              <option value="web">Web</option><option value="js">JavaScript</option><option value="express">Express</option>
            </select>
          </label>
        </div>
        <label className="text-sm text-zinc-400">Instruksi (markdown)<textarea name="prompt" defaultValue={ex.prompt} rows={4} className={`${field} mt-1`} /></label>
        <label className="text-sm text-zinc-400">Kode awal (JSON)<textarea name="starter" defaultValue={JSON.stringify(ex.starter, null, 2)} rows={5} className={`${field} mt-1 font-mono`} /></label>
        <label className="text-sm text-zinc-400">Solusi (JSON)<textarea name="solution" value={solution} onChange={(e) => setSolution(e.target.value)} rows={6} className={`${field} mt-1 font-mono`} /></label>
        <label className="text-sm text-zinc-400">Setup (dijalankan sebelum kode)<textarea name="setup" value={setup} onChange={(e) => setSetup(e.target.value)} rows={3} className={`${field} mt-1 font-mono`} /></label>
        <label className="text-sm text-zinc-400">Pemeriksaan (JSON: [{"{"}name, check{"}"}])<textarea name="tests" value={tests} onChange={(e) => setTests(e.target.value)} rows={6} className={`${field} mt-1 font-mono`} /></label>
        <div className="flex flex-wrap gap-2">
          <button className={smallButton}>Simpan latihan</button>
          <button type="button" onClick={uji} className={smallButton}><FlaskConical aria-hidden className="size-4" />Uji solusi</button>
        </div>
      </form>
      {out && (
        <ul aria-live="polite" className="mt-3 space-y-2 text-sm">
          {out.error && <li className="rounded-2xl bg-tile-pink px-4 py-2">{out.error}</li>}
          {out.results.map((r) => (
            <li key={r.name} className={`rounded-2xl px-4 py-2 ${r.pass ? "bg-tile-mint" : "bg-tile-pink"}`}>{r.name}{r.error ? `: ${r.error}` : ""}</li>
          ))}
        </ul>
      )}
      <form action={hapusLatihanKode} className="mt-2" onSubmit={(e) => { if (!confirm(`Hapus latihan "${ex.title}"?`)) e.preventDefault(); }}>
        <input type="hidden" name="id" value={ex.id} />
        <input type="hidden" name="topic" value={topic} />
        <button className={dangerButton}><Trash2 aria-hidden className="size-4" />Hapus latihan</button>
      </form>
    </li>
  );
}
```

- [ ] **Step 3: Wire** — in the admin topic page add to `Promise.all`: `db.from("code_exercises").select("*, chapters!inner(topic_id)").eq("chapters.topic_id", topic.id).order("position")`; under each chapter's questions render `<ul className="divide-y divide-zinc-800/80 pl-4">{exercises for that chapter.map((x) => <ExerciseEditor key={x.id} topic={slug} ex={x} />)}</ul>` and a form `tambahLatihanKode` with hidden `chapter` and `topic`, button "Tambah latihan kode".

- [ ] **Step 4: Verify and commit** `npx tsc --noEmit -p . && npx eslint app/admin components/admin` → clean; `git commit -m "Admin editor for code exercises with Uji solusi"`

---

### Task 7: Worker drafts and validates exercises

**Files:**
- Modify: `worker/prompt.ts`, `worker/prompt.test.ts`, `worker/import-deck.ts`

**Interfaces:**
- Consumes: `runChecksNode` (Task 2).
- Produces: `draftSchema.chapters[].exercises` (0-2), `export async function validateExercises(d: Draft): Promise<Draft>` in `worker/prompt.ts` (drops js/express exercises whose solution fails).

- [ ] **Step 1: Failing tests**

```ts
test("validateExercises drops an exercise whose solution fails its tests", async () => {
  const ok = { kind: "js", title: "Jumlah", prompt: "p", starter: { code: "" }, solution: { code: "function jumlah(a,b){return a+b}" }, setup: "", tests: [{ name: "2+3", check: "jumlah(2,3) === 5" }] };
  const bad = { ...ok, title: "Salah", solution: { code: "function jumlah(a,b){return a-b}" } };
  const d = draftSchema.parse({ ...valid, chapters: valid.chapters.map((c, i) => (i === 0 ? { ...c, exercises: [ok, bad] } : c)) });
  const out = await validateExercises(d);
  expect(out.chapters[0].exercises.map((e) => e.title)).toEqual(["Jumlah"]);
});
```

Run → FAIL (`validateExercises` not exported).

- [ ] **Step 2: Schema** in `worker/prompt.ts`:

```ts
const files = z.object({ html: z.string().optional(), css: z.string().optional(), js: z.string().optional(), code: z.string().optional() });
const exercise = z.object({
  kind: z.enum(["web", "js", "express"]),
  title: z.string().min(1).max(120),
  prompt: z.string().min(1).describe("Instruksi markdown singkat: apa yang harus dibuat dan hasil yang diharapkan"),
  starter: files,
  solution: files,
  setup: z.string().default(""),
  tests: z.array(z.object({ name: z.string().min(1), check: z.string().min(1).describe("Ekspresi JavaScript yang bernilai true bila benar; untuk express boleh memakai await request('GET', '/path')") })).min(1).max(6),
});
```

and in `chapter`: `exercises: z.array(exercise).max(2).default([]),`.

```ts
// Runs js/express solutions against their own tests; web is left to admin review.
export async function validateExercises(d: Draft): Promise<Draft> {
  const { runChecksNode } = await import("../lib/code/check-node.ts");
  for (const c of d.chapters) {
    const kept = [];
    for (const e of c.exercises) {
      if (e.kind === "web") {
        kept.push(e);
        continue;
      }
      const r = await runChecksNode({ kind: e.kind, code: e.solution.code ?? "", setup: e.setup, tests: e.tests });
      if (!r.error && r.results.every((x) => x.pass)) kept.push(e);
    }
    c.exercises = kept;
  }
  return d;
}
```

Prompt additions (system): `"Latihan kode hanya untuk bab yang memang praktik: web untuk HTML/CSS/React/Vue, js untuk logika JavaScript, express untuk route Express/Node. Solusi harus lolos semua pemeriksaan."`; (user): `"Tiap bab boleh punya 0 sampai 2 latihan kode: judul, instruksi, kode awal, solusi, setup (boleh kosong), dan 1 sampai 6 pemeriksaan berupa ekspresi JavaScript."`

- [ ] **Step 3: Worker** — after `parsed.success`, `const draft = await validateExercises(parsed.data)`; pass `draft` to `writeDraft`; inside the chapter loop after quiz insert:

```ts
    if (c.exercises.length) {
      maybe(
        await db.from("code_exercises").insert(c.exercises.map((e, ei) => ({ chapter_id: row.id, position: ei, ...e }))),
        `chapter ${slug} exercises`
      );
    }
```

- [ ] **Step 4: Run** `npx vitest run` → PASS; `npx tsc --noEmit -p .` → clean.

- [ ] **Step 5: Commit** `git commit -m "Worker drafts code exercises and drops ones whose solution fails"`

---

### Task 8: E2E, docs, ship

- [ ] **Step 1:** Add to `e2e/guest.e2e.ts` a test that opens the first chapter with a `js` exercise (skips when none): find `section[aria-labelledby^="kode-"]`, click "Periksa" with the starter (expect a pink row), then the test ends (writing into CodeMirror in E2E is out of scope).
- [ ] **Step 2:** Local `npx supabase db reset && npx supabase test db`, `npm run db:push`, `npx next build`, push; wait for CI and E2E.
- [ ] **Step 3:** Visual check of an exercise card (desktop, phone, dark) with playwright-cli after the first re-import drafts exercises; admin "Uji solusi" on one exercise.
- [ ] **Step 4:** GUIDELINE Features row "Latihan kode" and Data Model rows for `code_exercises`, `code_progress`; commit `"Document code exercises"`.
