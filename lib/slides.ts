// Slide file naming in Storage bucket `slides/<slug>/<folder>/`:
// slide-NN.avif (full), thumb-NN.avif (nav strip), cover.avif (cards).
// Pure and sync, safe in client components.

export type Slide = {
  index: number;
  src: string;
  width: number;
  height: number;
};

export type Presentation = {
  slug: string;
  title: string;
  description: string;
  slideCount: number;
  slides: Slide[];
};

export function slideUrl(path: string): string {
  return `${import.meta.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/slides/${path}`;
}

export function thumbSrc(slide: Slide): string {
  return slide.src.replace(/slide-(\d+)\.avif$/, "thumb-$1.avif");
}

// The 1600px variant beside every slide (worker, or
// scripts/backfill-slide-variants.mjs for decks rendered before it).
export function mediumSrc(slide: Slide): string {
  return slide.src.replace(/\.avif$/, "-1600.avif");
}

// Spread onto <img>: one retry with the full slide when the small variant
// fails, including failures that happened before hydration (no onError then).
export function retryWith(src: string) {
  const swap = (el: HTMLImageElement) => {
    el.onerror = null;
    if (el.getAttribute("src") !== src) el.src = src;
  };
  return {
    onError: (e: { currentTarget: HTMLImageElement }) => swap(e.currentTarget),
    ref: (el: HTMLImageElement | null) => {
      if (el?.complete && el.naturalWidth === 0) swap(el);
    },
  };
}

export function coverSrc(presentation: Presentation): string {
  return presentation.slides[0].src.replace(/slide-\d+\.avif$/, "cover.avif");
}
