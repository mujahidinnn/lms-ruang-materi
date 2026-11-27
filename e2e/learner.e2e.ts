import { expect, test } from "@playwright/test";

// A signed-in learner: sign in, finish a quiz-only chapter, see it on the
// dashboard, reach the exam page. Uses the dev student (E2E_STUDENT_EMAIL /
// E2E_STUDENT_PASSWORD) and is skipped without it. Writes only that
// account's chapter progress, which is idempotent; it never starts an exam,
// since attempts are limited.
const email = process.env.E2E_STUDENT_EMAIL;
const password = process.env.E2E_STUDENT_PASSWORD;
const KELAS = "figma";
const BAB = "pengenalan-figma";

test.skip(!email || !password, "E2E_STUDENT_EMAIL / E2E_STUDENT_PASSWORD not set");

test("a learner signs in, finishes a chapter quiz and reaches the exam page", async ({ page, isMobile }) => {
  test.skip(isMobile, "one run is enough for a flow that writes progress");
  test.setTimeout(90_000);

  await page.goto(`/masuk?next=${encodeURIComponent(`/belajar/${KELAS}/${BAB}`)}`);
  await page.waitForLoadState("networkidle"); // the form is an island
  await page.getByLabel("Email").fill(email!);
  await page.locator('input[name="password"]').fill(password!);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/belajar/${KELAS}/${BAB}$`));
  await page.waitForLoadState("networkidle");

  // Try options in order until each question shows "benar".
  const groups = page.getByRole("group", { name: /^Pilihan jawaban soal/ });
  const count = await groups.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const item = page.locator(`#soal-${i + 1}`);
    for (let n = 0; n < 4; n++) {
      await item.getByRole("group").getByRole("button").nth(n).click();
      if (await item.getByLabel("benar").isVisible()) break;
      await item.getByRole("button", { name: "Coba lagi" }).click();
    }
    await expect(item.getByLabel("benar")).toBeVisible();
  }
  await expect(page.getByText("Bab selesai", { exact: true })).toBeVisible();

  await page.goto("/dasbor");
  await expect(page.locator(`a[href^="/belajar/${KELAS}"]`).first()).toBeVisible();

  await page.goto(`/ujian/${KELAS}`);
  await expect(page.getByRole("heading", { level: 1, name: "Ujian akhir" })).toBeVisible();
});
