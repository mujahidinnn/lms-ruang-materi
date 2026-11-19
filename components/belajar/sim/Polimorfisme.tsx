import { useMemo, useState } from "react";
import Frame, { G, INK, simButton, simChip, simGhost } from "./Frame";
import { DAFTAR, KELAS, events } from "../../../lib/sim/polimorfisme";

const AMBER = "#f2c879";
const POS: Record<string, [number, number]> = { Hewan: [150, 28], Kucing: [38, 130], Anjing: [112, 130], Bebek: [188, 130], Ikan: [262, 130] };
const OBJ = DAFTAR.filter((d, i) => DAFTAR.indexOf(d) === i);

export default function Polimorfisme({ title }: { title: string }) {
  const [mode, setMode] = useState<"satu" | "loop">("satu");
  const [obj, setObj] = useState("Kucing");
  const [n, setN] = useState(-1);
  const ev = useMemo(() => events(mode === "loop" ? DAFTAR : [obj]), [mode, obj]);
  const e = n >= 0 ? ev[Math.min(n, ev.length - 1)] : null;
  const last = n >= ev.length - 1;
  const reset = (f: () => void) => { f(); setN(-1); };
  const visited = e ? e.lk.rantai.slice(0, e.k) : [];
  const hit = e && (e.selesai || visited.length === e.lk.rantai.length) ? e.lk.ditemukan : null;

  const kode = mode === "loop"
    ? ["daftar = [Kucing(), Ikan(), Bebek(), Anjing()]", "for h in daftar:", "    print(h.bersuara())"]
    : [`h = ${obj}()`, "print(h.bersuara())"];
  const teks = !e ? "Tekan Langkah untuk memanggil bersuara()."
    : e.selesai ? `${e.lk.ditemukan}.bersuara() dijalankan${e.lk.override ? " (menimpa milik Hewan)" : " (diwarisi dari Hewan)"}. Hasil: ${e.lk.suara}`
    : e.k < e.lk.rantai.length ? `${e.lk.rantai[e.k - 1]} tidak punya bersuara() sendiri, naik ke ${e.lk.rantai[e.k]}.`
    : `Python memeriksa ${e.lk.rantai[e.k - 1]}: bersuara() ditemukan di sini.`;

  return (
    <Frame title={title} hint="Pilih objek lalu panggil bersuara(). Lihat class mana yang method-nya dijalankan: menimpa sendiri atau mewarisi dari induk.">
      <div className="flex flex-wrap gap-2">
        <div role="group" aria-label="Mode" className="flex rounded-full bg-zinc-800 p-0.5">
          {([["satu", "Satu objek"], ["loop", "Perulangan for"]] as const).map(([m, l]) => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => reset(() => setMode(m))} className={simChip}>{l}</button>
          ))}
        </div>
        {mode === "satu" && (
          <div role="group" aria-label="Pilih objek" className="flex flex-wrap rounded-full bg-zinc-800 p-0.5">
            {OBJ.map((o) => <button key={o} type="button" aria-pressed={obj === o} onClick={() => reset(() => setObj(o))} className={`${simChip} px-3`}>{o}()</button>)}
          </div>
        )}
      </div>

      <div className="sim-stage mt-3 p-3">
        <svg viewBox="0 0 300 170" className="w-full" role="img" aria-label="Diagram class: Hewan di atas, Kucing, Anjing, Bebek, dan Ikan sebagai anak">
          {KELAS.filter((k) => k.induk).map((k) => {
            const [x, y] = POS[k.nama], [px, py] = POS.Hewan;
            const on = visited.includes(k.nama) && visited.includes("Hewan") && e && e.lk.rantai.includes(k.nama);
            return <line key={k.nama} x1={x} y1={y - 14} x2={px} y2={py + 14} stroke={on ? G : "#52525b"} strokeWidth={on ? 2.5 : 1.5} strokeDasharray={on ? undefined : "4 3"} />;
          })}
          {KELAS.map((k) => {
            const [x, y] = POS[k.nama];
            const isHit = hit === k.nama;
            const seen = visited.includes(k.nama);
            const isObj = e && e.obj === k.nama;
            return (
              <g key={k.nama} transform={`translate(${x},${y})`}>
                <rect x={-34} y={-14} width={68} height={k.nama === "Hewan" ? 34 : 50} rx={8} fill={isHit ? G : "#1c1f14"} stroke={isHit ? AMBER : seen ? G : isObj ? "#bfc0b5" : "#52525b"} strokeWidth={isHit || seen ? 2.5 : 1.5} />
                <text y={2} textAnchor="middle" fontSize={11} fontWeight={800} fill={isHit ? INK : "#f4f7ea"}>{k.nama}</text>
                <text y={k.nama === "Hewan" ? 15 : 17} textAnchor="middle" fontSize={8.5} fill={isHit ? INK : "#a5a79b"}>{k.suara === null ? "(mewarisi)" : `→ ${k.suara === "..." ? "…" : k.suara}`}</text>
                {k.suara === null && <text y={31} textAnchor="middle" fontSize={8.5} fill={isHit ? INK : "#a5a79b"}>tanpa override</text>}
              </g>
            );
          })}
          {e && <text x={150} y={166} textAnchor="middle" fontSize={10} fill="#bfc0b5">objek: {e.obj}()</text>}
        </svg>

        <pre className="mt-2 overflow-x-auto rounded-lg bg-black/40 py-2 text-xs sm:text-sm" aria-label="Kode Python">
          {kode.map((l, i) => <code key={i} className="block px-3 whitespace-pre text-zinc-300">{l}</code>)}
        </pre>
        <div className="mt-2 rounded-xl bg-black/40 px-3 py-2 font-mono text-sm" aria-label="Keluaran">
          <span className="text-zinc-500">keluaran: </span>
          <span className="font-bold text-[#e8efd6]">{e && e.hasil.length ? e.hasil.join("  ") : "(kosong)"}</span>
        </div>
        <p role="status" className="mt-2 min-h-10 text-sm font-bold text-[#b5d36f]">{teks}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className={simButton} disabled={last} onClick={() => setN(n + 1)} aria-label="Langkah berikutnya">Langkah</button>
        <button type="button" className={simGhost} disabled={n < 0} onClick={() => setN(-1)}>Ulang</button>
      </div>
    </Frame>
  );
}
