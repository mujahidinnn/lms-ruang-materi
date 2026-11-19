import { useState } from "react";
import Frame, { simChip } from "./Frame";
import { type Bits, WHO, fromOctal, fromSymbolic, toOctal, toSymbolic } from "../../../lib/sim/chmod";

const PRESETS = [["644", "berkas biasa"], ["755", "skrip / folder"], ["600", "privat"], ["777", "hindari"]];
const BIT = ["Baca (r) 4", "Tulis (w) 2", "Eksekusi (x) 1"];
const WORD = ["membaca", "mengubah", "menjalankan"];
const field = "min-h-11 rounded-xl border-2 border-noir bg-zinc-800 px-3 font-mono text-base font-bold aria-[invalid=true]:border-[#ff6b4a]";

type S = { bits: Bits; oct: string; sym: string };
const make = (bits: Bits): S => ({ bits, oct: toOctal(bits), sym: toSymbolic(bits) });

export default function ChmodCalculator({ title }: { title: string }) {
  const [s, setS] = useState<S>(() => make(fromOctal("754")!));
  const octOk = fromOctal(s.oct) !== null;
  const symOk = fromSymbolic(s.sym) !== null;
  const mode = toOctal(s.bits);
  const sym = toSymbolic(s.bits);

  const toggle = (i: number) => setS(make(s.bits.map((b, j) => (j === i ? !b : b))));
  const onOct = (v: string) => { const b = fromOctal(v); setS(b ? { bits: b, oct: v, sym: toSymbolic(b) } : { ...s, oct: v }); };
  const onSym = (v: string) => { const b = fromSymbolic(v); setS(b ? { bits: b, oct: toOctal(b), sym: v } : { ...s, sym: v }); };

  return (
    <Frame title={title} hint="Centang izin, atau ubah angka oktal dan teks rwx. Ketiganya selalu sinkron.">
      <div className="sim-stage p-3 sm:p-4">
        <div className="grid grid-cols-3 gap-2">
          {WHO.map((w, g) => (
            <fieldset key={w} className="min-w-0 rounded-xl bg-zinc-800/70 p-2">
              <legend className="px-1 text-[11px] font-bold text-[#b5d36f] sm:text-xs">{w}</legend>
              {BIT.map((b, k) => (
                <label key={b} className="flex min-h-11 cursor-pointer items-center gap-2 text-xs font-bold sm:text-sm">
                  <input type="checkbox" checked={s.bits[g * 3 + k]} onChange={() => toggle(g * 3 + k)} className="size-5 shrink-0 accent-[var(--color-matcha-400)]" />
                  <span>{b}</span>
                </label>
              ))}
              <p className="mt-1 text-center font-mono text-lg font-extrabold text-[#b5d36f]">{[0, 1, 2].reduce((a, k) => a + (s.bits[g * 3 + k] ? [4, 2, 1][k] : 0), 0)}</p>
            </fieldset>
          ))}
        </div>

        <div className="mt-3 overflow-x-auto rounded-lg bg-black/40 px-3 py-2 font-mono text-xs whitespace-pre sm:text-sm" aria-label="Contoh keluaran ls -l">
          <span className="text-zinc-500">$ ls -l deploy.sh{"\n"}</span>
          <span className="text-[#b5d36f]">-{sym}</span> 1 budi tim 2048 Mar  3 10:12 deploy.sh{"\n"}
          <span className="text-zinc-500">$ </span>chmod {mode} deploy.sh
        </div>
        <ul className="mt-2 grid gap-0.5 text-sm text-zinc-300">
          {WHO.map((w, g) => {
            const can = WORD.filter((_, k) => s.bits[g * 3 + k]);
            return <li key={w}><strong className="text-[#e8efd6]">{w.split(" ")[0]}</strong>: {can.length ? `boleh ${can.join(", ")}` : "tidak boleh apa pun"}</li>;
          })}
        </ul>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-bold">Oktal
          <input value={s.oct} onChange={(e) => onOct(e.target.value)} maxLength={3} inputMode="numeric" autoComplete="off" aria-invalid={!octOk} aria-describedby="chm-err" className={field} />
        </label>
        <label className="grid gap-1 text-sm font-bold">Simbolik
          <input value={s.sym} onChange={(e) => onSym(e.target.value)} maxLength={10} autoComplete="off" spellCheck={false} aria-invalid={!symOk} aria-describedby="chm-err" className={field} />
        </label>
      </div>
      <p id="chm-err" role="status" className="mt-1 min-h-5 text-sm text-[#ff6b4a]">
        {!octOk ? "Oktal harus tiga angka 0 sampai 7, mis. 754." : !symOk ? "Tulis sembilan karakter r, w, x, atau -, mis. rwxr-xr--." : ""}
      </p>

      <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label="Contoh umum">
        {PRESETS.map(([o, d]) => <button key={o} type="button" className={`${simChip} bg-zinc-800`} onClick={() => setS(make(fromOctal(o)!))}>{o} · {d}</button>)}
      </div>
    </Frame>
  );
}
