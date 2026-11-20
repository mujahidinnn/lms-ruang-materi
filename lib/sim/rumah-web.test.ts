import { expect, test } from "vitest";
import { catatan, keadaan } from "./rumah-web";

test("CSS dan JS tidak berefek tanpa HTML", () => {
  expect(keadaan({ html: false, css: true, js: true })).toEqual({ elemen: false, berwarna: false, hidup: false });
  expect(catatan({ html: false, css: true, js: false })).toContain("tidak ada elemen HTML");
});

test("tiap lapisan menyalakan bagiannya sendiri", () => {
  expect(keadaan({ html: true, css: true, js: false })).toEqual({ elemen: true, berwarna: true, hidup: false });
  expect(keadaan({ html: true, css: false, js: true })).toEqual({ elemen: true, berwarna: false, hidup: true });
});

test("setiap kombinasi punya catatan berbeda", () => {
  const all = [false, true].flatMap((html) => [false, true].flatMap((css) => [false, true].map((js) => catatan({ html, css, js }))));
  expect(new Set(all).size).toBeGreaterThanOrEqual(5);
});
