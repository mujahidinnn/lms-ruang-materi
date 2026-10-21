import { expect, test, type Page } from "@playwright/test";
import type { Check } from "../lib/code/check-node";
import { buildSandboxDoc, type ExerciseFiles, type SandboxKind } from "../lib/code/sandbox-doc";

// The sandbox document on a blank page, run the way useSandbox runs it.
async function run(page: Page, kind: SandboxKind, files: ExerciseFiles, tests: Check[], setup = "", ms = 3000) {
  await page.setContent("<button id='b' onclick=\"this.textContent='ok'\">tes</button>");
  const doc = buildSandboxDoc({ kind, files, setup, tests, nonce: "n" });
  return page.evaluate(
    ([doc, ms]) =>
      new Promise<{ logs: string[]; results: { name: string; pass: boolean; error?: string }[]; error?: string }>((resolve) => {
        const f = document.createElement("iframe");
        f.setAttribute("sandbox", "allow-scripts");
        const t = setTimeout(() => (f.remove(), resolve({ logs: [], results: [], error: "Kode berjalan terlalu lama" })), ms);
        addEventListener("message", (e) => e.data?.nonce === "n" && !e.data.ready && (clearTimeout(t), f.remove(), resolve(e.data)));
        f.srcdoc = doc;
        document.body.append(f);
      }),
    [doc, ms] as const
  );
}

test("const and let in setup and code are visible to checks", async ({ page }) => {
  const r = await run(page, "js", { code: "const jumlah = (a, b) => a + b + basis;" }, [{ name: "x", check: "jumlah(2, 3) === 5" }], "let basis = 0;");
  expect(r.results).toEqual([{ name: "x", pass: true }]);
});

test("an infinite loop in js stops with a clear message and the page stays usable", async ({ page }) => {
  const r = await run(page, "js", { code: "while (true) {}" }, []);
  expect(r.error).toMatch(/terlalu lama/);
  await page.click("#b");
  await expect(page.locator("#b")).toHaveText("ok");
});

test("an infinite loop in a web exercise stops too", async ({ page }) => {
  const r = await run(page, "web", { html: "<p>x</p>", css: "", js: "for (;;) { }" }, []);
  expect(r.error).toMatch(/terlalu lama/);
});

test("web checks run after the page has rendered", async ({ page }) => {
  const js = "setTimeout(() => { document.querySelector('#app').textContent = 'Halo'; }, 0);";
  const r = await run(page, "web", { html: "<div id=app></div>", css: "", js }, [{ name: "x", check: "document.querySelector('#app').textContent === 'Halo'" }]);
  expect(r.results[0].pass).toBe(true);
});

test("an unclosed tag in learner html does not swallow the harness", async ({ page }) => {
  const r = await run(page, "web", { html: "<textarea>", css: "", js: "" }, [{ name: "x", check: "true" }]);
  expect(r.results[0].pass).toBe(true);
});

test("a throwing check fails with its error; express still works", async ({ page }) => {
  const code = "const app = require('express')(); app.get('/a', (q, r) => r.send('b'));";
  const r = await run(page, "express", { code }, [
    { name: "ok", check: "(await request('GET', '/a')).body === 'b'" },
    { name: "boom", check: "tidakAda()" },
  ]);
  expect(r.results[0].pass).toBe(true);
  expect(r.results[1]).toMatchObject({ pass: false });
  expect(r.results[1].error).toMatch(/tidakAda/);
});

test("python runs on Pyodide: prints, checks, and the last traceback line as the error", async ({ page }) => {
  test.setTimeout(90_000);
  const ok = await run(page, "python", { code: "def kuadrat(x):\n    return x * x\nprint('halo')" }, [{ name: "4", check: "kuadrat(2) == 4" }, { name: "salah", check: "kuadrat(3) == 10" }], "", 60_000);
  expect(ok.logs).toContain("halo");
  expect(ok.results).toEqual([{ name: "4", pass: true }, { name: "salah", pass: false }]);
  const bad = await run(page, "python", { code: "print(belum_ada)" }, [], "", 60_000);
  expect(bad.error).toMatch(/^NameError/);
});
