// Tabel utilitas Tailwind yang ditampilkan simulasi (1 unit = 4px = 0.25rem).
export const SPACE = [2, 4, 6, 8] as const;
export const MARGIN = [0, 2, 4, 8] as const;
export const WIDTHS = { "w-32": 128, "w-48": 192, "w-64": 256, "w-full": "100%" } as const;
export const RADIUS = { "rounded-none": 0, "rounded-md": 6, "rounded-lg": 8, "rounded-2xl": 16, "rounded-full": 9999 } as const;
export const STEPS = [100, 300, 500, 700, 900] as const;
export const HUES = { blue: ["#dbeafe", "#93c5fd", "#3b82f6", "#1d4ed8", "#1e3a8a"], rose: ["#ffe4e6", "#fda4af", "#f43f5e", "#be123c", "#881337"], emerald: ["#d1fae5", "#6ee7b7", "#10b981", "#047857", "#064e3b"] } as const;
export type Hue = keyof typeof HUES;
export const WHITE = "#ffffff";

export const px = (unit: number) => unit * 4;
export const rem = (unit: number) => unit * 0.25;

export const shade = (hue: Hue, step: number) => HUES[hue][STEPS.indexOf(step as (typeof STEPS)[number])];

export type Cfg = { p: number; m: number; w: keyof typeof WIDTHS; bgHue: Hue; bg: number; text: "white" | "black" | number; rounded: keyof typeof RADIUS };

export function classString(c: Cfg) {
  const t = c.text === "white" ? "text-white" : c.text === "black" ? "text-black" : `text-${c.bgHue}-${c.text}`;
  return [`p-${c.p}`, c.m ? `m-${c.m}` : "", c.w, `bg-${c.bgHue}-${c.bg}`, t, c.rounded].filter(Boolean).join(" ");
}

export function styleOf(c: Cfg) {
  const color = c.text === "white" ? WHITE : c.text === "black" ? "#000000" : shade(c.bgHue, c.text);
  return { padding: px(c.p), margin: px(c.m), width: WIDTHS[c.w], background: shade(c.bgHue, c.bg), color, borderRadius: RADIUS[c.rounded] };
}
