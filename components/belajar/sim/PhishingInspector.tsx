import { useState } from "react";
import { type Hotspot, SCENARIOS, scoreFlags } from "../../../lib/sim/phishing";
import Frame, { simButton, simChip, simGhost } from "./Frame";

export default function PhishingInspector({ title }: { title: string }) {
  const [si, setSi] = useState(0);
  const [flagged, setFlagged] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [peek, setPeek] = useState(false);
  const s = SCENARIOS[si];
  const r = checked ? scoreFlags(s, flagged) : null;

  const pick = (i: number) => { setSi(i); setFlagged([]); setChecked(false); setPeek(false); };
  const toggle = (id: string) => { if (!checked) setFlagged((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])); };
  const spot = (id: string) => s.spots.find((x) => x.id === id) as Hotspot | undefined;

  // Each tappable part: neutral, flagged, or (after check) correct / wrong / missed.
  const tap = (id: string, label: string, children: React.ReactNode, extra = "") => {
    const sp = spot(id);
    const on = flagged.includes(id);
    let ring = on ? "outline outline-2 outline-[#d9534f] bg-[#d9534f]/15" : "outline outline-1 outline-dashed outline-zinc-400/60";
    if (r && sp) {
      if (sp.flag && on) ring = "outline outline-2 outline-[#2e7d32] bg-[#2e7d32]/15";
      else if (!sp.flag && on) ring = "outline outline-2 outline-[#c77700] bg-[#c77700]/15";
      else if (sp.flag) ring = "outline outline-2 outline-dashed outline-[#d9534f]";
    }
    return (
      <button type="button" aria-pressed={on} aria-label={`${label}: ${on ? "ditandai mencurigakan" : "belum ditandai"}`} onClick={() => toggle(id)} className={`min-h-11 w-full rounded-lg px-2 py-1 text-left ${ring} ${extra}`}>
        {children}
      </button>
    );
  };

  return (
    <Frame title={title} hint="Ketuk bagian surel yang menurutmu mencurigakan, lalu tekan Periksa. Tidak semua surel itu penipuan.">
      <div role="group" aria-label="Pilih surel" className="flex gap-1 rounded-full bg-zinc-800 p-1">
        {SCENARIOS.map((x, i) => <button key={x.id} type="button" aria-pressed={si === i} onClick={() => pick(i)} className={`${simChip} flex-1 px-2`}>{x.label}</button>)}
      </div>
      <div className="sim-stage mt-3 p-3 sm:p-4">
        <div className="grid gap-2 rounded-xl bg-[#f4f4ef] p-3 text-[13px] text-[#1c1c18]">
          {tap("sender", "Pengirim", <><b>{s.fromName}</b><br /><span className="break-all font-mono text-xs">&lt;{s.fromAddr}&gt;</span></>)}
          {tap("subject", "Subjek", <b className="break-words">{s.subject}</b>)}
          {tap("greeting", "Sapaan", <>{s.greeting}</>)}
          {tap("body", "Isi pesan", <span className="break-words leading-5">{s.body}</span>)}
          {tap("link", "Tautan", <>
            <span className="break-all font-bold text-[#1a56c4] underline">{s.linkText}</span>
            {peek && <span className="mt-1 block break-all font-mono text-[11px] text-[#7a1f1f]">Alamat asli: {s.linkUrl}</span>}
          </>)}
          {s.attachment && tap("attachment", "Lampiran", <span className="break-all font-mono text-xs">Lampiran: {s.attachment}</span>)}
        </div>
        <button type="button" onClick={() => setPeek(!peek)} aria-pressed={peek} className="mt-2 min-h-11 text-xs font-bold text-[#8fc5ea] underline">{peek ? "Sembunyikan alamat asli tautan" : "Arahkan kursor ke tautan (lihat alamat asli)"}</button>

        {r && (
          <div aria-live="polite" className="sim-pop mt-2 grid gap-2 text-sm">
            <p className="font-bold text-[#b5d36f]">
              {r.hits.length} bendera merah ditemukan, {r.missed.length} terlewat, {r.falseAlarms.length} salah curiga.
              {s.spots.every((x) => !x.flag) && " Surel ini sah."}
            </p>
            <ul className="grid gap-2">
              {s.spots.filter((x) => x.flag || flagged.includes(x.id)).map((x) => {
                const state = x.flag ? (flagged.includes(x.id) ? "Ditemukan" : "Terlewat") : "Salah curiga";
                const color = x.flag ? (flagged.includes(x.id) ? "#b5d36f" : "#f08a7a") : "#f2c879";
                return <li key={x.id} className="rounded-xl bg-zinc-900 p-2 text-zinc-300"><b style={{ color }}>{state}</b> <span className="text-zinc-400">({x.part})</span><br />{x.why}</li>;
              })}
            </ul>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setChecked(true)} disabled={checked} className={simButton}>Periksa</button>
        <button type="button" onClick={() => { setFlagged([]); setChecked(false); setPeek(false); }} className={simGhost}>Ulangi</button>
        <span className="text-sm text-zinc-400">{flagged.length} bagian ditandai</span>
      </div>
    </Frame>
  );
}
