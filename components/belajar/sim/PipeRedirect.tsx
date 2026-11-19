import { useMemo, useState } from "react";
import Frame, { simButton, simChip, simGhost } from "./Frame";
import { PRESETS, run } from "../../../lib/sim/pipe-redirect";

const MAX = 5;
function Lines({ lines }: { lines: string[] }) {
  if (!lines.length) return <p className="px-2 py-1 text-[11px] text-zinc-600">(kosong)</p>;
  return (
    <ul className="px-2 py-1 font-mono text-[11px] leading-snug sm:text-xs">
      {lines.slice(0, MAX).map((l, i) => <li key={i} className="sim-pop break-all whitespace-pre-wrap">{l}</li>)}
      {lines.length > MAX && <li className="text-zinc-500">+{lines.length - MAX} baris lagi</li>}
    </ul>
  );
}
function Lane({ name, tone, to, lines }: { name: string; tone: string; to: string; lines: string[] }) {
  return (
    <div className="rounded-lg border border-dashed" style={{ borderColor: `${tone}66` }}>
      <p className="flex flex-wrap justify-between gap-x-2 px-2 pt-1 text-[11px] font-extrabold" style={{ color: tone }}>
        <span>{name}</span><span className="font-bold opacity-80">{to}</span>
      </p>
      <Lines lines={lines} />
    </div>
  );
}

export default function PipeRedirect({ title }: { title: string }) {
  const [pi, setPi] = useState(0);
  const [n, setN] = useState(0);
  const res = useMemo(() => run(PRESETS[pi]!), [pi]);
  const st = res.stages;
  const shown = st.slice(0, n);
  const screen = shown.flatMap((s) => s.toScreen);
  const files = n ? st[n - 1]!.files : {};
  const written = new Set(shown.flatMap((s) => s.touched));
  const done = n === st.length;

  return (
    <Frame title={title} hint="Pilih perintah, lalu maju satu tahap. Lihat ke mana stdout dan stderr setiap tahap mengalir: pipe, berkas, atau layar.">
      <div className="flex flex-wrap gap-1 rounded-3xl bg-zinc-800 p-1" role="group" aria-label="Contoh perintah">
        {PRESETS.map((p, i) => (
          <button key={p} type="button" aria-pressed={pi === i} onClick={() => { setPi(i); setN(0); }} className={`${simChip} grow break-all text-left font-mono text-xs`}>{p}</button>
        ))}
      </div>

      <div className="sim-stage mt-3 p-3 sm:p-4">
        <p className="rounded-lg bg-black/50 px-3 py-2 font-mono text-xs break-all sm:text-sm"><span className="text-[#b5d36f]">$</span> {PRESETS[pi]}</p>

        <ol className="mt-3 flex flex-col gap-2" aria-label="Tahap pipeline">
          {st.map((s, i) => (
            <li key={i} className={`rounded-xl border-2 p-2 transition-opacity ${i < n ? "border-zinc-600" : "border-zinc-800 opacity-40"} ${i === n - 1 ? "border-[#b5d36f]" : ""}`}>
              <p className="font-mono text-xs font-bold break-all text-[#e8efd6] sm:text-sm">{s.text}</p>
              {i < n && (
                <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
                  <Lane name="stdin (0)" tone="#8fc5ea" to={`dari ${s.stdinFrom === "pipe" ? "pipe" : s.stdinFrom}`} lines={s.stdin} />
                  <Lane name="stdout (1)" tone="#b5d36f" to={`→ ${s.outTo}`} lines={s.out} />
                  <Lane name="stderr (2)" tone="#f5a98e" to={`→ ${s.errTo}`} lines={s.err} />
                </div>
              )}
            </li>
          ))}
        </ol>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-black/50 p-2" aria-live="polite">
            <p className="text-[11px] font-extrabold text-zinc-300">Layar</p>
            <Lines lines={screen} />
          </div>
          <div className="rounded-xl bg-black/50 p-2">
            <p className="text-[11px] font-extrabold text-zinc-300">Berkas yang tertulis</p>
            {written.size === 0 ? <p className="px-2 py-1 text-[11px] text-zinc-600">(belum ada)</p> : [...written].map((f) => (
              <div key={f} className="mb-1"><p className="px-2 font-mono text-[11px] font-bold text-[#f2c879]">{f}</p><Lines lines={files[f] ?? []} /></div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className={simButton} disabled={done} onClick={() => setN(n + 1)}>Tahap berikutnya</button>
        <button type="button" className={simGhost} disabled={n === 0} onClick={() => setN(n - 1)}>Mundur</button>
        <button type="button" className={simGhost} disabled={n === 0} onClick={() => setN(0)}>Ulangi</button>
        <span className="text-sm text-zinc-400">Tahap {n} dari {st.length}</span>
      </div>
    </Frame>
  );
}
