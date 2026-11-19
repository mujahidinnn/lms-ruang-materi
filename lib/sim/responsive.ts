export const BREAKPOINTS = [{ name: "sm", px: 640 }, { name: "md", px: 768 }, { name: "lg", px: 1024 }, { name: "xl", px: 1280 }] as const;
export type Mode = "mobile-first" | "desktop-first";
export type Rule = { prefix: string; bp: number; cols: number };

const bp = (n: string) => BREAKPOINTS.find((b) => b.name === n)!.px;

// Urutan rule = urutan penulisan; yang terakhir aktif menang.
export const RULES: Record<Mode, Rule[]> = {
  "mobile-first": [{ prefix: "", bp: 0, cols: 1 }, { prefix: "sm:", bp: bp("sm"), cols: 2 }, { prefix: "lg:", bp: bp("lg"), cols: 4 }],
  "desktop-first": [{ prefix: "", bp: Infinity, cols: 4 }, { prefix: "max-lg:", bp: bp("lg"), cols: 2 }, { prefix: "max-sm:", bp: bp("sm"), cols: 1 }],
};

// min-width: aktif bila lebar >= bp. max-width: aktif bila lebar < bp.
export const isActive = (mode: Mode, r: Rule, width: number) => (mode === "mobile-first" ? width >= r.bp : width < r.bp);

export function resolve(mode: Mode, width: number) {
  const active = RULES[mode].filter((r) => isActive(mode, r, width));
  return { active, winner: active[active.length - 1] };
}

export const classText = (mode: Mode) => "grid " + RULES[mode].map((r) => `${r.prefix}grid-cols-${r.cols}`).join(" ");

export const activeBreakpoint = (width: number) => [...BREAKPOINTS].reverse().find((b) => width >= b.px)?.name ?? "dasar";
