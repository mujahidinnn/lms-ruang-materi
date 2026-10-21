// Gemini in the owner's signed-in Chrome (the approach of porto/sopi's
// scripts/gemini-web.mjs): no API key, no daily API quota. Local runs only,
// through `npm run draft:local`. Never logs the deck or the answer.
// ponytail: CSS selectors follow Gemini's current web UI; when Google changes it, fix SEL below.
import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { chromium, type Page } from "playwright-core";
import type { Prompt } from "../prompt.ts";
import { extractJson } from "./json.ts";
import { simpleSchema } from "./schema.ts";
import { ProviderError, type DraftResult } from "./types.ts";

const SEL = {
  input: 'rich-textarea div[contenteditable="true"], div[contenteditable="true"][role="textbox"]',
  send: 'button[aria-label*="Send" i], button[aria-label*="Kirim" i]',
  stop: 'button[aria-label*="Stop" i], button[aria-label*="Hentikan" i]',
  temporary: 'button[aria-label*="Temporary chat" i], button[aria-label*="Percakapan sementara" i]',
  response: "model-response",
  attached: 'uploader-file-preview, [data-test-id*="preview" i], [data-test-id*="file" i]',
};
// Shared with porto/sopi, so the owner signs in once. Own port: sopi uses 9333.
const PROFILE = join(homedir(), ".sopi-gemini");
const PORT = 9334;
const GEMINI = `https://gemini.google.com/u/${process.env.GEMINI_WEB_ACCOUNT ?? 0}/app`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let page: Page | null = null;

async function open(): Promise<Page> {
  if (page) return page;
  const reachable = () => fetch(`http://127.0.0.1:${PORT}/json/version`).then(() => true, () => false);
  if (!(await reachable())) {
    const show = process.env.GEMINI_WEB_SHOW === "1";
    spawn("google-chrome", [...(show ? [] : ["--headless=new"]), "--window-size=1280,900", `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, "--no-first-run", GEMINI], { detached: true, stdio: "ignore" }).unref();
    for (let i = 0; i < 40 && !(await reachable()); i++) await sleep(500);
  }
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`).catch(() => {
    throw new ProviderError(`Chrome did not start on port ${PORT}; close other windows using ${PROFILE}`);
  });
  const context = browser.contexts()[0];
  page = context.pages()[0] ?? (await context.newPage());
  return page;
}

export async function generateDraft(pdf: Buffer, prompt: Prompt, _model: string, jsonSchema: unknown): Promise<DraftResult> {
  const p = await open();
  await p.goto(GEMINI, { waitUntil: "commit", timeout: 60_000 }).catch(() => {});
  // A temporary chat keeps decks out of the owner's Gemini history.
  const temp = p.locator(SEL.temporary).first();
  if (await temp.waitFor({ timeout: 15_000 }).then(() => true, () => false)) await temp.click();
  const input = p.locator(SEL.input).first();
  await input.waitFor({ timeout: 30_000 }).catch(() => {
    throw new ProviderError("Gemini prompt box not found (signed out? run: npm run draft:local -- --login)");
  });
  await input.click();

  // Pasting a File is what Ctrl+V does; a paste before the uploader is wired
  // up is dropped, so try up to three times.
  const b64 = pdf.toString("base64");
  let attached = false;
  for (let i = 0; i < 3 && !attached; i++) {
    await input.evaluate((el, data) => {
      const dt = new DataTransfer();
      dt.items.add(new File([Uint8Array.from(atob(data), (c) => c.charCodeAt(0))], "deck.pdf", { type: "application/pdf" }));
      el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
    }, b64);
    attached = await p.locator(SEL.attached).first().waitFor({ timeout: 20_000 }).then(() => true, () => false);
  }
  if (!attached) throw new ProviderError("the deck PDF did not attach in Gemini");
  await sleep(4000);

  const text = [
    prompt.system,
    prompt.user,
    "Jawab hanya dengan satu blok ```json berisi satu objek JSON yang mengikuti skema ini, tanpa teks lain:",
    JSON.stringify(simpleSchema(jsonSchema)),
  ].join("\n\n");
  await p.keyboard.press("Control+A");
  await p.keyboard.press("Delete");
  await p.keyboard.insertText(text);
  await sleep(500);
  const send = p.locator(SEL.send).first();
  if (await send.isEnabled().catch(() => false)) await send.click();
  else await p.keyboard.press("Enter");

  // Done when the stop button is gone and the answer has not changed for 5 s.
  const answer = p.locator(SEL.response).last();
  await answer.waitFor({ timeout: 120_000 }).catch(() => {
    throw new ProviderError("Gemini did not answer");
  });
  const deadline = Date.now() + 10 * 60_000;
  let last = "", stableSince = Date.now();
  while (Date.now() < deadline) {
    await sleep(1000);
    const now = await answer.innerText().catch(() => "");
    const busy = await p.locator(SEL.stop).first().isVisible().catch(() => false);
    if (now !== last) {
      last = now;
      stableSince = Date.now();
    } else if (!busy && now && Date.now() - stableSince > 5000) break;
  }
  return { output: extractJson(last), inputTokens: 0, outputTokens: 0 };
}
