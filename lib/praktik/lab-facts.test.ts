import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

// Facts in the three lab chapters that a review found wrong once; pinned so
// they stay corrected. Read from the draft that is imported and published.
const draft = JSON.parse(readFileSync("content/drafts/jaringan-komputer.json", "utf8"));
const body = (slug: string): string => draft.chapters.find((c: { slug: string }) => c.slug === slug).body;

test("a lost password points to the physical reset button, not to a command that needs a login", () => {
  const b = body("praktik-router-pertama");
  expect(b).toMatch(/sandi hilang[^.]*tombol reset/i);
  expect(b).not.toMatch(/misalnya saat sandi hilang/i);
});

test("reset-configuration is described as returning to the default configuration", () => {
  const b = body("praktik-router-pertama");
  expect(b).toMatch(/reset-configuration[\s\S]{0,400}konfigurasi bawaan/);
  expect(b).not.toContain("menghapus seluruh konfigurasi");
});

test("the /ip address print example lists the dynamic address that the DHCP client example binds", () => {
  const b = body("praktik-router-pertama");
  expect(b).toMatch(/\/ip address print[\s\S]{0,300}1 D 203\.0\.113\.5\/24/);
});

test("Windows DNS is read with ipconfig /all", () => {
  expect(body("praktik-uji-konektivitas")).toContain("`ipconfig /all`");
});

test("macOS does not get the Linux ip command for its gateway", () => {
  const b = body("praktik-uji-konektivitas");
  expect(b).not.toMatch(/Linux atau macOS, `ip route`/);
  expect(b).toContain("netstat -nr");
});
