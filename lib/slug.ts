// A name as a slug: lowercase, accents dropped, anything else becomes a hyphen.
export const toSlug = (name: string) =>
  name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export const SLUG_RE = /^[a-z0-9-]+$/;
