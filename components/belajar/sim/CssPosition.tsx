import { useState } from "react";
import { paintOrder, type Pos } from "@/lib/sim/css";
import Chips, { range, snippet } from "./Chips";
import Frame, { simGhost } from "./Frame";

const POS: readonly Pos[] = ["static", "relative", "absolute", "fixed", "sticky"];
const NOTE: Record<Pos, string> = {
  static: "static: posisi normal di alur, top dan left tidak berpengaruh.",
  relative: "relative: bergeser dari posisi aslinya, ruang aslinya tetap dipesan.",
  absolute: "absolute: keluar dari alur, patokannya induk yang positioned (kotak putus-putus).",
  fixed: "fixed: patokannya layar dan diam saat di-scroll (di sini disimulasikan di dalam panggung).",
  sticky: "sticky: normal dulu, lalu menempel saat area di-scroll melewati nilai top.",
};
const block = "grid h-9 place-items-center rounded-lg text-xs font-bold";

type Card = { name: string; pos: Pos; z: number; bg: string };
const CARDS: Card[] = [
  { name: "A", pos: "relative", z: 1, bg: "#b5d36f" },
  { name: "B", pos: "relative", z: 2, bg: "#e8efd6" },
  { name: "C", pos: "relative", z: 3, bg: "#f0b36a" },
];

export default function CssPosition({ title }: { title: string }) {
  const [pos, setPos] = useState<Pos>("relative");
  const [top, setTop] = useState(20);
  const [left, setLeft] = useState(30);
  const [cards, setCards] = useState(CARDS);
  const order = paintOrder(cards);
  const set = (i: number, patch: Partial<Card>) => setCards((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  const target = (
    <div
      className={`${block} w-28 bg-[#e8efd6] text-[#12140d] shadow-[0_0_0_2px_#12140d,0_0_0_4px_#b5d36f]`}
      style={{ position: pos === "fixed" ? "absolute" : pos, top: pos === "static" ? undefined : top, left: pos === "static" || pos === "sticky" ? undefined : left, zIndex: 5 }}
    >
      kotak target
    </div>
  );
  const flow = pos !== "absolute" && pos !== "fixed";

  return (
    <Frame title={title} hint="Ganti nilai position lalu geser top dan left. Scroll area di dalam panggung untuk melihat beda fixed dan sticky.">
      <div className="sim-stage relative overflow-hidden">
        {pos === "fixed" && <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>{target}</div>}
        <div tabIndex={0} aria-label="Area yang bisa di-scroll" className="h-56 overflow-y-auto p-3">
          <div className={`${block} bg-zinc-700 text-zinc-300`}>sebelum induk</div>
          <div className="relative my-2 grid gap-2 rounded-xl border-2 border-dashed border-matcha-300/60 p-3">
            <span className="text-xs text-matcha-300">induk (position: relative)</span>
            <div className={`${block} bg-zinc-700 text-zinc-300`}>saudara 1</div>
            {flow ? target : <div className={`${block} border border-dashed border-zinc-500 text-zinc-500`}>ruang kosong</div>}
            {pos === "absolute" && <div aria-hidden className="pointer-events-none absolute inset-0">{target}</div>}
            <div className={`${block} bg-zinc-700 text-zinc-300`}>saudara 2</div>
          </div>
          {Array.from({ length: 6 }, (_, i) => <div key={i} className={`${block} mb-2 bg-zinc-800 text-zinc-500`}>konten lain {i + 1}</div>)}
        </div>
      </div>
      <p className="mt-2 text-sm text-zinc-400">{NOTE[pos]}</p>
      <div className="mt-3 grid gap-3">
        <Chips label="position" value={pos} options={POS} onChange={setPos} />
        <div className="grid gap-x-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-bold">top: {top}px<input type="range" min={0} max={80} value={top} disabled={pos === "static"} onChange={(e) => setTop(+e.target.value)} className={range} /></label>
          <label className="grid gap-1 text-sm font-bold">left: {left}px<input type="range" min={0} max={80} value={left} disabled={pos === "static" || pos === "sticky"} onChange={(e) => setLeft(+e.target.value)} className={range} /></label>
        </div>
      </div>
      <pre className={snippet}>{pos === "static" ? ".target {\n  position: static;\n}" : `.target {\n  position: ${pos};\n  top: ${top}px;${pos === "sticky" ? "" : `\n  left: ${left}px;`}\n}`}</pre>

      <h4 className="mt-6 text-base font-extrabold">z-index: siapa di atas</h4>
      <p className="mt-1 text-sm text-zinc-400">Ubah z-index tiap kartu. Jadikan satu kartu static: z-index-nya diabaikan dan ia selalu di bawah kartu positioned.</p>
      <div className="sim-stage mt-3 p-3">
        <div className="relative h-40">
          {cards.map((c, i) => (
            <div
              key={c.name}
              className="grid w-3/5 content-start justify-items-start rounded-xl border-2 border-noir px-2.5 pt-1.5 text-sm font-extrabold text-[#12140d] transition-[top,left] duration-300"
              style={{ background: c.bg, height: 80, position: c.pos === "static" ? "static" : "absolute", top: c.pos === "static" ? undefined : i * 28, left: c.pos === "static" ? undefined : i * 14 + "%", zIndex: c.pos === "static" ? undefined : c.z, boxShadow: "0 4px 0 rgb(0 0 0 / 0.35)" }}
            >
              {c.name}{c.pos === "static" ? " (z diabaikan)" : ` z=${c.z}`}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {cards.map((c, i) => (
          <div key={c.name} className="flex items-center justify-between gap-1 rounded-xl border-2 border-noir bg-zinc-800 p-1.5">
            <span className="px-1.5 text-sm font-bold">{c.name}</span>
            <button type="button" aria-label={`Kurangi z-index kartu ${c.name}`} disabled={c.pos === "static"} onClick={() => set(i, { z: c.z - 1 })} className={`${simGhost} !min-w-11 !px-0`}>-</button>
            <span className="min-w-6 text-center text-sm font-bold">{c.pos === "static" ? "-" : c.z}</span>
            <button type="button" aria-label={`Tambah z-index kartu ${c.name}`} disabled={c.pos === "static"} onClick={() => set(i, { z: c.z + 1 })} className={`${simGhost} !min-w-11 !px-0`}>+</button>
            <button type="button" aria-pressed={c.pos === "static"} onClick={() => set(i, { pos: c.pos === "static" ? "relative" : "static" })} className={`${simGhost} aria-pressed:bg-noir aria-pressed:text-on-noir`}>static</button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-zinc-400">Urutan dari bawah ke atas: <strong className="text-current">{order.map((i) => cards[i].name).join(" , ")}</strong></p>
    </Frame>
  );
}
