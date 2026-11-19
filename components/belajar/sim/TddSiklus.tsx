import { useState } from "react";
import Frame, { simButton, simGhost } from "./Frame";
import { type Fase, STEPS } from "../../../lib/sim/tdd";

const WARNA: Record<Fase, string> = { merah: "#ff8a80", hijau: "#b5d36f", refaktor: "#9ec9ff" };
const NAMA: Record<Fase, string> = { merah: "Merah", hijau: "Hijau", refaktor: "Refaktor" };
const NODE: Record<Fase, [number, number]> = { merah: [150, 30], hijau: [250, 130], refaktor: [50, 130] };

export default function TddSiklus({ title }: { title: string }) {
  const [n, setN] = useState(0);
  const s = STEPS[n];
  const lolos = s.tes.filter((t) => t.lolos).length;
  const gagal = s.tes.find((t) => t.lolos === false);

  return (
    <Frame title={title} hint="Maju satu langkah: tes ditulis, gagal, dibuat lolos dengan kode minimal, lalu dirapikan.">
      <div className="sim-stage p-3">
        <svg viewBox="0 0 300 170" className="mx-auto w-full max-w-sm" role="img" aria-label={`Siklus TDD, fase sekarang ${NAMA[s.fase]}, putaran ${s.putaran}`}>
          <defs><marker id="tddar" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L8 4L0 8z" fill="#8b8d81" /></marker></defs>
          <path d="M178 40 Q235 55 245 100" fill="none" stroke="#8b8d81" strokeWidth="1.5" markerEnd="url(#tddar)" />
          <path d="M215 140 Q150 165 85 140" fill="none" stroke="#8b8d81" strokeWidth="1.5" markerEnd="url(#tddar)" />
          <path d="M55 100 Q65 55 122 40" fill="none" stroke="#8b8d81" strokeWidth="1.5" markerEnd="url(#tddar)" />
          {(Object.keys(NODE) as Fase[]).map((f) => {
            const [x, y] = NODE[f], on = s.fase === f;
            return (
              <g key={f} transform={`translate(${x},${y})`}>
                <circle r={on ? 30 : 26} fill={on ? WARNA[f] : "#1c1f14"} stroke={WARNA[f]} strokeWidth={on ? 3 : 1.5} style={on ? { filter: `drop-shadow(0 0 8px ${WARNA[f]}88)` } : undefined} />
                <text y={4} textAnchor="middle" fontSize={11} fontWeight={800} fill={on ? "#12140d" : WARNA[f]}>{NAMA[f]}</text>
              </g>
            );
          })}
          <text x={150} y={90} textAnchor="middle" fontSize={11} fontWeight={700} fill="#bfc0b5">putaran {s.putaran}</text>
        </svg>

        <div className="mt-2 rounded-xl bg-black/40 p-2" aria-label="Test runner">
          <p className="mb-1 text-xs font-bold text-zinc-400">Test runner: {lolos} lolos{gagal ? ", 1 gagal" : ""}</p>
          <ul className="space-y-1">
            {s.tes.map((t) => (
              <li key={t.nama} className="flex items-start gap-2 text-xs sm:text-sm">
                <span aria-hidden className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: t.lolos ? WARNA.hijau : WARNA.merah }} />
                <span className="min-w-0"><span className="sr-only">{t.lolos ? "lolos: " : "gagal: "}</span><span className="font-mono break-words">{t.nama}</span>
                  {t.lolos === false && t.pesan && <span className="block font-mono text-[#ff8a80] break-words">{t.pesan}</span>}</span>
              </li>
            ))}
          </ul>
        </div>

        <pre className="mt-2 min-h-16 overflow-x-auto rounded-lg bg-black/40 py-2 text-xs sm:text-sm" aria-label="Kode implementasi">
          {s.kode.length === 0 && <code className="block px-3 text-zinc-500">// belum ada kode</code>}
          {s.kode.map((l, i) => <code key={i} className={`block px-3 whitespace-pre ${s.baru.includes(i) ? "bg-[#b5d36f]/20 text-[#b5d36f]" : "text-zinc-300"}`}>{l}</code>)}
        </pre>
        <p role="status" className="mt-2 min-h-12 text-sm font-bold" style={{ color: WARNA[s.fase] }}>{s.teks}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className={simButton} disabled={n >= STEPS.length - 1} onClick={() => setN(n + 1)}>Langkah berikutnya</button>
        <button type="button" className={simGhost} disabled={n === 0} onClick={() => setN(n - 1)}>Mundur</button>
        <button type="button" className={simGhost} disabled={n === 0} onClick={() => setN(0)}>Ulang</button>
        <span className="text-sm text-zinc-400">Langkah {n + 1} dari {STEPS.length}</span>
      </div>
    </Frame>
  );
}
