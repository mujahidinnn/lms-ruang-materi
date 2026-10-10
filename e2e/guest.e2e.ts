import { expect, test } from "@playwright/test";

const front = (page: import("@playwright/test").Page) => page.getByRole("link", { name: /^Buka materi / });

test("landing shows the hero and topic lists", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ruang untuk belajar");
  await expect(page.getByRole("heading", { name: "Belajar lewat roadmap" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Semua materi" })).toBeVisible();
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

test("roadmap opens a track and a topic panel", async ({ page }) => {
  await page.goto("/roadmap");
  await page.locator('main a[href^="/roadmap/"]').first().click();
  await expect(page).toHaveURL(/\/roadmap\/[a-z0-9-]+$/);
  await page.locator("main ol button").first().click();
  await expect(page.getByRole("link", { name: "Belajar" })).toBeVisible();
});

test("the slide viewer moves to the next slide", async ({ page, isMobile }) => {
  await page.goto("/belajar/github");
  await page.waitForLoadState("networkidle"); // a key press before hydration is lost
  const stage = page.locator("img[srcset]").first();
  await expect(stage).toHaveAttribute("alt", /slide 1 dari/);
  if (isMobile) await page.getByRole("button", { name: "Ke slide 2", exact: true }).click();
  else await page.keyboard.press("ArrowRight");
  await expect(page.locator("img[srcset]").first()).toHaveAttribute("alt", /slide 2 dari/);
});

test("practice gives instant feedback to a guest", async ({ page }) => {
  await page.goto("/latihan/github");
  await page.getByRole("group", { name: "Pilihan jawaban" }).getByRole("button").first().click();
  await page.getByRole("button", { name: "Periksa jawaban" }).click();
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
  await page.getByLabel(/Kata sandi/).fill("salah-sekali-123");
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
  await expect(nav.getByRole("link", { name: "Beranda" })).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: "Roadmap" }).click();
  await expect(page).toHaveURL(/\/roadmap$/);
});
