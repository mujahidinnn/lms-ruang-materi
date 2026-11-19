import { useState } from "react";
import Frame, { simChip } from "./Frame";
import { type Band, DIGITS, EXPS, TOLS, decode, encode, expBand, format, parse } from "../../../lib/sim/resistor";

type Pick = { d1: number; d2: number; exp: number; tol: number };

function Swatches({ label, items, value, onPick }: { label: string; items: Band[]; value: number; onPick: (i: number) => void }) {
  return (
    <div role="group" aria-label={label} className="grid gap-1">
      <p className="text-sm font-bold">{label}: <span className="text-zinc-400">{items[value]?.name}</span></p>
      <div className="flex flex-wrap gap-1">
        {items.map((b, i) => (
          <button key={b.name} type="button" aria-label={b.name} aria-pressed={i === value} onClick={() => onPick(i)}
            className="grid size-11 place-items-center rounded-full">
            <span className={`size-8 rounded-full border-2 ${i === value ? "border-[#b5d36f] ring-2 ring-[#b5d36f]/50" : "border-zinc-600"}`} style={{ background: b.hex }} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function KodeWarnaResistor({ title }: { title: string }) {
  const [mode, setMode] = useState<"gelang" | "nilai">("gelang");
  const [pick, setPick] = useState<Pick>({ d1: 4, d2: 7, exp: 2, tol: 5 });
  const [text, setText] = useState("4k7");

  const typed = parse(text);
  const enc = typed === null ? null : encode(typed);
  const cur = mode === "nilai" && enc ? { ...enc, tol: pick.tol } : pick;
  const ohms = decode(cur.d1, cur.d2, cur.exp);
  const tol = TOLS[cur.tol];
  const bands = [DIGITS[cur.d1], DIGITS[cur.d2], expBand(cur.exp), TOLS[cur.tol]];
  const names = bands.map((b) => b.name).join(", ");
  const set = (k: keyof Pick) => (i: number) => setPick((p) => ({ ...p, [k]: i }));
  const err = mode === "nilai" && !enc ? (typed === null ? "Tulis angka, mis. 4k7, 330, atau 2,2M." : "Nilai ini tidak bisa dikodekan dengan 2 angka dan 1 pengali.") : "";

  return (
    <Frame title={title} hint="Pilih warna tiap gelang untuk membaca nilainya, atau ketik nilai untuk melihat gelangnya.">
      <div className="sim-stage p-3 sm:p-4">
        <svg viewBox="0 0 320 110" role="img" aria-label={`Resistor dengan gelang ${names}`} className="h-auto w-full">
          <path d="M0 55h70M250 55h70" stroke="#c9ced6" strokeWidth="5" strokeLinecap="round" />
          <rect x="50" y="36" width="40" height="38" fill="#d9b98a" />
          <rect x="230" y="36" width="40" height="38" fill="#d9b98a" />
          <circle cx="68" cy="55" r="19" fill="#d9b98a" /><circle cx="252" cy="55" r="19" fill="#d9b98a" />
          <rect x="84" y="25" width="152" height="60" rx="14" fill="#d9b98a" />
          {[104, 134, 164].map((x, i) => <rect key={x} x={x} y="25" width="14" height="60" fill={bands[i].hex} stroke="#00000044" />)}
          <rect x="210" y="25" width="14" height="60" fill={bands[3].hex} stroke="#00000044" />
          <rect x="84" y="25" width="152" height="18" rx="9" fill="#ffffff22" />
          {["1", "2", "×", "±"].map((l, i) => <text key={l} x={[111, 141, 171, 217][i]} y="104" fontSize="11" fill="#8a9171" textAnchor="middle" fontWeight="700">{l}</text>)}
        </svg>
        <p className="mt-1 text-center text-2xl font-extrabold text-[#b5d36f]" aria-live="polite">{err ? "?" : `${format(ohms)} ±${String(tol.pct).replace(".", ",")}%`}</p>
        {!err && <p className="mt-1 text-center text-sm text-zinc-400">{cur.d1}{cur.d2} × 10<sup>{cur.exp}</sup> Ω = {ohms.toLocaleString("id-ID", { maximumFractionDigits: 2 })} Ω</p>}
      </div>

      <div className="mt-3 flex gap-1 rounded-full bg-zinc-800 p-1" role="group" aria-label="Mode">
        {(["gelang", "nilai"] as const).map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={`${simChip} flex-1`}>{m === "gelang" ? "Gelang → nilai" : "Nilai → gelang"}</button>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        {mode === "gelang" ? (
          <>
            <Swatches label="Gelang 1 (angka)" items={DIGITS} value={pick.d1} onPick={set("d1")} />
            <Swatches label="Gelang 2 (angka)" items={DIGITS} value={pick.d2} onPick={set("d2")} />
            <Swatches label="Gelang 3 (pengali)" items={EXPS.map(expBand)} value={EXPS.indexOf(pick.exp)} onPick={(i) => setPick((p) => ({ ...p, exp: EXPS[i] }))} />
          </>
        ) : (
          <label className="grid gap-1 text-sm font-bold">Nilai resistor
            <input value={text} onChange={(e) => setText(e.target.value)} inputMode="text" autoComplete="off" aria-invalid={!!err} aria-describedby="rw-err" placeholder="mis. 4k7, 330, 2,2M"
              className="min-h-11 rounded-xl border-2 border-noir bg-zinc-800 px-3 text-base font-bold" />
            <span id="rw-err" role="status" className="min-h-5 text-sm font-normal text-[#ff6b4a]">{err}</span>
          </label>
        )}
        <Swatches label="Gelang 4 (toleransi)" items={TOLS} value={pick.tol} onPick={set("tol")} />
      </div>
    </Frame>
  );
}
