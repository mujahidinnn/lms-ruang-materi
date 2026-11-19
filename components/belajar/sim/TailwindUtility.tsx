import { useState } from "react";
import { classString, HUES, type Cfg, type Hue, px, rem, RADIUS, shade, STEPS, styleOf, WIDTHS } from "@/lib/sim/tailwind";
import Chips, { snippet } from "./Chips";
import Frame from "./Frame";

const SP = [2, 4, 6, 8].map((n) => `p-${n}`);
const MG = [0, 2, 4, 8].map((n) => `m-${n}`);
const TX = ["text-white", "text-black", "text-100", "text-900"] as const;
const num = (s: string) => +s.split("-")[1];
const unit = (u: number) => `${u} = ${px(u)}px = ${rem(u)}rem`;

export default function TailwindUtility({ title }: { title: string }) {
  const [c, setC] = useState<Cfg>({ p: 4, m: 2, w: "w-48", bgHue: "blue", bg: 500, text: "white", rounded: "rounded-lg" });
  const set = (v: Partial<Cfg>) => setC((o) => ({ ...o, ...v }));
  const s = styleOf(c);
  const tx = c.text === "white" ? "text-white" : c.text === "black" ? "text-black" : `text-${c.text}`;

  return (
    <Frame title={title} hint="Pilih utilitas, lihat class string dan kotaknya berubah. Satu unit Tailwind = 4px = 0,25rem.">
      <div className="sim-stage p-3">
        <div className="overflow-hidden rounded-lg bg-[#0a0c06] p-2">
          <div className="inline-block max-w-full border border-dashed border-amber-400/70 bg-amber-400/10 align-top" style={{ padding: s.margin }} role="img" aria-label={`Kotak contoh dengan padding ${px(c.p)}px dan margin ${px(c.m)}px`}>
            <div className="box-border max-w-full font-bold" style={{ width: s.width, minWidth: 0, background: s.background, color: s.color, borderRadius: s.borderRadius, padding: s.padding }}>
              <div className="bg-sky-300/30 outline outline-1 outline-dashed outline-sky-300" style={{ borderRadius: Math.max(0, s.borderRadius - s.padding) }}>
                <p className="px-1 py-2 text-sm">Halo, Tailwind</p>
              </div>
            </div>
          </div>
        </div>
        <ul className="mt-2 grid gap-1 text-xs text-zinc-300 sm:grid-cols-2">
          <li><span className="mr-1 inline-block size-2 bg-amber-400/70" />margin: {c.m ? `${px(c.m)}px` : "0"}</li>
          <li><span className="mr-1 inline-block size-2 bg-sky-300/70" />padding: {px(c.p)}px</li>
          <li>lebar: {typeof s.width === "number" ? `${s.width}px` : "100% wadah"}</li>
          <li>radius: {s.borderRadius >= 9999 ? "penuh" : `${s.borderRadius}px`}</li>
        </ul>
      </div>
      <pre className={snippet} aria-label="Class string">{`class="${classString(c)}"`}</pre>
      <p className="mt-1 text-xs text-zinc-400">p-{c.p}: {unit(c.p)}{c.m ? ` · m-${c.m}: ${unit(c.m)}` : ""}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Chips label="Padding" value={`p-${c.p}`} options={SP} onChange={(v) => set({ p: num(v) })} />
        <Chips label="Margin" value={`m-${c.m}`} options={MG} onChange={(v) => set({ m: num(v) })} />
        <Chips label="Lebar" value={c.w} options={Object.keys(WIDTHS) as (keyof typeof WIDTHS)[]} onChange={(w) => set({ w })} />
        <Chips label="Sudut" value={c.rounded} options={Object.keys(RADIUS) as (keyof typeof RADIUS)[]} onChange={(rounded) => set({ rounded })} />
        <Chips label="Warna dasar" value={c.bgHue} options={Object.keys(HUES) as Hue[]} onChange={(bgHue) => set({ bgHue })} />
        <Chips label="Tingkat warna latar" value={`bg-${c.bgHue}-${c.bg}`} options={STEPS.map((n) => `bg-${c.bgHue}-${n}`)} onChange={(v) => set({ bg: +v.split("-")[2] })} />
        <Chips label="Warna teks" value={tx} options={TX} onChange={(v) => set({ text: v === "text-white" ? "white" : v === "text-black" ? "black" : (+v.split("-")[1] as 100 | 900) })} />
        <div className="grid content-start gap-1">
          <span className="text-sm font-bold">Contoh warna terpilih</span>
          <div className="flex items-center gap-2 text-xs text-zinc-300"><span className="size-6 rounded border border-zinc-600" style={{ background: shade(c.bgHue, c.bg) }} />{shade(c.bgHue, c.bg)}</div>
        </div>
      </div>
    </Frame>
  );
}
