import { expect, test } from "vitest";
import { coverSrc, slideUrl, thumbSrc, type Slide } from "./slides";

const slide: Slide = { index: 3, src: "https://x.co/slides/git/migrasi/slide-03.avif", width: 3200, height: 1800 };

test("thumb and cover sit next to the slide", () => {
  expect(thumbSrc(slide)).toBe("https://x.co/slides/git/migrasi/thumb-03.avif");
  expect(coverSrc({ slug: "git", title: "Git", description: "", slideCount: 1, slides: [slide] })).toBe(
    "https://x.co/slides/git/migrasi/cover.avif"
  );
});

test("slideUrl points at the public slides bucket", () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
  expect(slideUrl("git/migrasi/slide-01.avif")).toBe(
    "https://abc.supabase.co/storage/v1/object/public/slides/git/migrasi/slide-01.avif"
  );
});
