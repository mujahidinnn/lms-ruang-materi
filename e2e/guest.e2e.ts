import { expect, test } from "@playwright/test";

const front = (page: import("@playwright/test").Page) => page.getByRole("link", { name: /^Buka materi / });

test("landing shows the hero and topic lists", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Belajar ngoding");
  await expect(page.getByRole("heading", { name: "Bingung mulai dari mana?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kelas populer untuk pemula" })).toBeVisible();
});

test("pulling the front cover brings the next one forward", async ({ page, isMobile }) => {
  test.skip(isMobile, "touch drag is covered on desktop with the mouse");
  await page.goto("/");
  const before = await front(page).getAttribute("aria-label");
  const box = (await front(page).boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 60, y - 160, { steps: 10 });
  await page.mouse.up();
  await expect(front(page)).not.toHaveAttribute("aria-label", before!);
});

test("dark theme is a choice that survives a reload", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Pakai tema gelap" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Pakai tema terang" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", "dark");
});

test("a learning path opens a track and a class panel", async ({ page }) => {
  await page.goto("/roadmap");
  await page.locator('main a[href^="/roadmap/"]').first().click();
  await expect(page).toHaveURL(/\/roadmap\/[a-z0-9-]+$/);
  await page.waitForLoadState("networkidle"); // a click before hydration opens nothing
  await page.locator("main ol button").first().click();
  await expect(page.getByRole("link", { name: "Buka kelas" })).toBeVisible();
});

test("the slide viewer moves to the next slide", async ({ page, isMobile }) => {
  await page.goto("/belajar/github/slide");
  await page.waitForLoadState("networkidle"); // a key press before hydration is lost
  const stage = page.locator("img[srcset]").first();
  await expect(stage).toHaveAttribute("alt", /slide 1 dari/);
  if (isMobile) await page.getByRole("button", { name: "Ke slide 2", exact: true }).click();
  else await page.keyboard.press("ArrowRight");
  await expect(page.locator("img[srcset]").first()).toHaveAttribute("alt", /slide 2 dari/);
});

test("practice gives instant feedback to a guest", async ({ page }) => {
  await page.goto("/latihan/github");
  await page.waitForLoadState("networkidle");
  await page.getByRole("group", { name: "Pilihan jawaban" }).getByRole("button").first().click();
  // The key shows at once: the answer is marked and the next step appears.
  await expect(page.getByLabel(/^(benar|salah)$/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Soal berikutnya|Lihat hasil/ })).toBeVisible();
});

test("private pages send a guest to the login page", async ({ page }) => {
  await page.goto("/dasbor");
  await expect(page).toHaveURL(/\/masuk\?next=%2Fdasbor/);
  await expect(page.getByRole("heading", { name: "Masuk" })).toBeVisible();
});

test("a wrong password is refused with a clear message", async ({ page }) => {
  await page.goto("/masuk");
  await page.getByLabel("Email").fill("tidak-ada@contoh.id");
  await page.getByRole("tab", { name: "Password" }).click();
  await page.getByLabel(/Password/).fill("salah-sekali-123");
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page.getByText("Email atau kata sandi salah.")).toBeVisible();
});

test("unknown pages show the 404 page", async ({ page }) => {
  const res = await page.goto("/tidak-ada-halaman-ini");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Halaman tidak ditemukan" })).toBeVisible();
});

test("phones get the floating bottom nav", async ({ page, isMobile }) => {
  test.skip(!isMobile, "phone only");
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Navigasi utama" });
  await expect(nav.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: "Roadmap" }).click();
  await expect(page).toHaveURL(/\/roadmap$/);
});

test("a course lists chapters, a chapter quiz gives feedback, next chapter opens", async ({ page }) => {
  await page.goto("/belajar/nodejs");
  await expect(page.getByRole("heading", { name: "Daftar bab" })).toBeVisible();
  await page.locator('ol a[href^="/belajar/nodejs/"]').first().click();
  await expect(page.getByRole("heading", { name: "Cek pemahaman" })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.getByRole("group").first().getByRole("button").first().click();
  await expect(page.getByLabel(/^(benar|salah)$/).first()).toBeVisible();
  const heading = await page.getByRole("heading", { level: 1 }).textContent();
  await page.getByRole("navigation", { name: "Bab lain" }).getByRole("link").last().click();
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(heading ?? "");
  await expect(page.getByText(/^Bab 2 dari/)).toBeVisible();
});

test("exam prep draws a set and checks each answer at once", async ({ page }) => {
  await page.goto("/latihan/nodejs/persiapan");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Mulai try out" }).click();
  await expect(page.getByText(/^Soal 1 dari \d+/)).toBeVisible();
  await page.getByRole("group", { name: "Pilihan jawaban" }).getByRole("button").first().click();
  await expect(page.getByLabel(/^(benar|salah)$/).first()).toBeVisible();
});

test("a code exercise fails the starter, then passes with the solution", async ({ page }) => {
  await page.goto("/belajar/nodejs/membangun-aplikasi-web-dan-rest-api");
  const card = page.locator('section[aria-labelledby^="kode-"]').first();
  // CodeMirror loads as its own chunk after the island hydrates.
  await expect(card.locator(".cm-content")).toBeVisible({ timeout: 15_000 });
  await page.waitForLoadState("networkidle");
  const check = card.getByRole("button", { name: "Periksa" });
  await check.click();
  await expect(card.getByLabel("gagal").first()).toBeVisible();
  await check.click();
  await card.getByRole("button", { name: "Lihat solusi" }).click();
  await check.click();
  await expect(card.getByText("Lolos", { exact: true })).toBeVisible();
  await expect(card.getByLabel("gagal")).toHaveCount(0);
});

test("an unknown certificate code shows the 404 page", async ({ page }) => {
  const res = await page.goto("/sertifikat/TIDAK-ADA");
  expect(res?.status()).toBe(404);
});
