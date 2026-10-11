import { expect, test, type Page } from "@playwright/test";
import type { Check } from "../lib/code/check-node";
import { buildSandboxDoc, type ExerciseFiles, type SandboxKind } from "../lib/code/sandbox-doc";

// The sandbox document on a blank page, run the way useSandbox runs it.
async function run(page: Page, kind: SandboxKind, files: ExerciseFiles, tests: Check[], setup = "") {
  await page.setContent("<button id='b' onclick=\"this.textContent='ok'\">tes</button>");
  const doc = buildSandboxDoc({ kind, files, setup, tests, nonce: "n" });
  return page.evaluate(
    (doc) =>
      new Promise<{ logs: string[]; results: { name: string; pass: boolean; error?: string }[]; error?: string }>((resolve) => {
        const f = document.createElement("iframe");
        f.setAttribute("sandbox", "allow-scripts");
        const t = setTimeout(() => (f.remove(), resolve({ logs: [], results: [], error: "Kode berjalan terlalu lama" })), 3000);
        addEventListener("message", (e) => e.data?.nonce === "n" && (clearTimeout(t), f.remove(), resolve(e.data)));
        f.srcdoc = doc;
        document.body.append(f);
      }),
    doc
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
