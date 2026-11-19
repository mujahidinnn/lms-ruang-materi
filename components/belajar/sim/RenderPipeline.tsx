import { useEffect, useRef, useState } from "react";
import Frame, { G, reducedMotion, simButton, simChip } from "./Frame";
import { type Lane, type Node, type NodeState, type Variant, stateAt, timeline } from "../../../lib/sim/render-pipeline";

const VARIANTS: { id: Variant; label: string; code: string; note: string }[] = [
  { id: "tanpa", label: "Tanpa script", code: "<link rel=\"stylesheet\" href=\"style.css\">", note: "Parser membaca HTML tanpa gangguan; render menunggu CSSOM." },
  { id: "biasa", label: "Script biasa", code: "<script src=\"app.js\"></script>", note: "Parser berhenti sampai script diunduh dan dijalankan. Elemen di bawahnya tertunda." },
  { id: "defer", label: "defer", code: "<script src=\"app.js\" defer></script>", note: "Diunduh paralel, dijalankan setelah HTML selesai diurai. Parsing tidak terganggu." },
  { id: "async", label: "async", code: "<script src=\"app.js\" async></script>", note: "Diunduh paralel, tapi dijalankan begitu siap dan menyela parser." },
];
const LANES: { id: Lane; label: string }[] = [{ id: "parse", label: "Parser" }, { id: "fetch", label: "Jaringan" }, { id: "exec", label: "Script" }, { id: "css", label: "CSS" }];
const NODES: { id: Node; label: string }[] = [
  { id: "dom", label: "DOM" }, { id: "cssom", label: "CSSOM" }, { id: "tree", label: "Render tree" }, { id: "layout", label: "Layout" }, { id: "paint", label: "Paint" },
];
const LABEL: Record<NodeState, string> = { idle: "menunggu", active: "bekerja", blocked: "terblokir", done: "selesai" };
const STYLE: Record<NodeState, string> = {
  idle: "border-zinc-700 text-zinc-500", active: "border-[#b5d36f] bg-[#b5d36f]/15 text-[#b5d36f] sim-blink",
  blocked: "border-[#ff6b4a] bg-[#ff6b4a]/15 text-[#ff6b4a]", done: "border-[#6b7d3c] text-[#e8efd6]",
};
const BAR: Record<Lane, string> = { parse: "#b5d36f", fetch: "#8fc5ea", exec: "#f2c879", css: "#c9a8ff" };

export default function RenderPipeline({ title }: { title: string }) {
  const [v, setV] = useState<Variant>("biasa");
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);
  const tl = timeline(v);
  const st = stateAt(v, t);
  const cur = VARIANTS.find((x) => x.id === v)!;
  const lanes = LANES.filter((l) => tl.bars.some((b) => b.lane === l.id));

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      setT((x) => {
        const n = x + dt * 1.6;
        if (n >= tl.end) { setPlaying(false); return tl.end; }
        return n;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, tl.end]);

  const pick = (id: Variant) => { setV(id); setT(0); setPlaying(false); };
  const play = () => {
    if (reducedMotion()) return setT(tl.end);
    if (t >= tl.end) setT(0);
    setPlaying(true);
  };
  const pct = (x: number) => `${(x / tl.end) * 100}%`;

  return (
    <Frame title={title} hint="Putar linimasa lalu ganti cara memuat script. Lihat kapan parser berhenti dan kapan halaman pertama tergambar.">
      <div className="flex flex-wrap gap-1 rounded-3xl bg-zinc-800 p-1" role="group" aria-label="Cara memuat script">
        {VARIANTS.map((x) => <button key={x.id} type="button" aria-pressed={v === x.id} onClick={() => pick(x.id)} className={`${simChip} grow`}>{x.label}</button>)}
      </div>

      <div className="sim-stage mt-3 p-3 sm:p-4">
        <code className="block overflow-x-auto rounded-lg bg-black/40 px-3 py-2 text-xs whitespace-pre text-[#e8efd6] sm:text-sm">{cur.code}</code>

        <ol className="mt-3 grid grid-cols-5 gap-1 text-center text-[11px] font-bold sm:text-xs" aria-label="Tahap rendering">
          {NODES.map((n) => (
            <li key={n.id} className={`rounded-xl border-2 px-0.5 py-2 ${STYLE[st[n.id]]}`}>
              {n.label}
              <span className="block text-[10px] font-normal">{LABEL[st[n.id]]}</span>
            </li>
          ))}
        </ol>

        <div className="relative mt-4" role="img" aria-label={`Linimasa ${cur.label}: DOM selesai pada ${tl.parseEnd}, halaman tergambar pada ${tl.paint}`}>
          <div className="grid gap-1.5">
            {lanes.map((l) => (
              <div key={l.id} className="grid grid-cols-[3.5rem_1fr] items-center gap-2">
                <span className="text-[11px] text-zinc-400">{l.label}</span>
                <div className="relative h-7 rounded bg-zinc-800/70">
                  {tl.bars.filter((b) => b.lane === l.id).map((b) => (
                    <span key={b.label + b.start} className={`absolute inset-y-0 grid place-items-center overflow-hidden rounded text-[10px] font-extrabold whitespace-nowrap text-[#12140d] ${b.block ? "ring-2 ring-[#ff6b4a]" : ""}`} style={{ left: pct(b.start), width: pct(b.end - b.start), background: BAR[l.id] }}>{b.label}</span>
                  ))}
                  {l.id === "parse" && <span className="absolute inset-y-0 grid place-items-center rounded bg-white/90 px-1 text-[10px] font-extrabold text-[#12140d]" style={{ left: pct(tl.paint), width: pct(1) }}>Paint</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 left-[4rem]">
            <div className="absolute inset-y-0 w-0.5 bg-white" style={{ left: pct(Math.min(t, tl.end)) }} />
            <div className="absolute inset-y-0 w-px border-l border-dashed border-[#c9a8ff]" style={{ left: pct(tl.dcl) }} />
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-400"><span className="text-[#c9a8ff]">Garis putus-putus</span>: DOMContentLoaded. Bingkai merah: parser terhenti.</p>
        <p role="status" className="mt-2 text-sm font-bold" style={{ color: G }}>{cur.note}</p>
      </div>

      <div className="mt-3 grid grid-cols-[auto_1fr] items-center gap-3">
        <button type="button" onClick={play} disabled={playing} className={simButton}>{playing ? "Berjalan…" : t >= tl.end ? "Ulangi" : "Putar"}</button>
        <label className="grid text-sm font-bold"><span className="sr-only">Waktu</span>
          <input type="range" aria-label="Waktu" min={0} max={tl.end} step={0.05} value={t} onChange={(e) => { setPlaying(false); setT(+e.target.value); }} className="min-h-11 w-full accent-[var(--color-matcha-400)]" />
        </label>
      </div>
    </Frame>
  );
}
