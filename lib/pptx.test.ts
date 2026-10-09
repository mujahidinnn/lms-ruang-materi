import { expect, test } from "vitest";
import { countSlides, isZip } from "./pptx";

const enc = (s: string) => new TextEncoder().encode(s);

test("counts unique slide parts, ignores rels and layouts", () => {
  const bytes = enc(
    "PK\x03\x04ppt/slides/slide1.xml..ppt/slides/slide2.xml..ppt/slides/_rels/slide1.xml.rels" +
      "..ppt/slideLayouts/slideLayout1.xml..ppt/slides/slide1.xml"
  );
  expect(countSlides(bytes)).toBe(2);
});

test("zip magic", () => {
  expect(isZip(enc("PK\x03\x04rest"))).toBe(true);
  expect(isZip(enc("%PDF-1.7"))).toBe(false);
});
