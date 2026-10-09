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
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/slides/${path}`;
}

export function thumbSrc(slide: Slide): string {
  return slide.src.replace(/slide-(\d+)\.avif$/, "thumb-$1.avif");
}

export function coverSrc(presentation: Presentation): string {
  return presentation.slides[0].src.replace(/slide-\d+\.avif$/, "cover.avif");
}
