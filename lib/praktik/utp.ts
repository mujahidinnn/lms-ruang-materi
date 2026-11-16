// Pin 1 to 8 of an RJ45 plug, by wire color (putih-X = white with an X stripe).
// Used by scripts/praktik.mjs and pinned by svg.test.ts.
export const T568B = ["putih-oranye", "oranye", "putih-hijau", "biru", "putih-biru", "hijau", "putih-cokelat", "cokelat"] as const;
export const T568A = ["putih-hijau", "hijau", "putih-oranye", "biru", "putih-biru", "oranye", "putih-cokelat", "cokelat"] as const;

// Real wire colors on purpose: they are the lesson.
export const WIRE_HEX: Record<string, string> = {
  oranye: "#f0861a",
  hijau: "#2e9e4f",
  biru: "#2a6fdb",
  cokelat: "#8b5a2b",
};
