import { useState } from "react";
import { DEFAULT_RULES, PAKET, TEMPLATE, fmtAddr, proses, teksAturan, type Rule } from "@/lib/sim/firewall-nat";
import Frame, { simButton, simGhost } from "./Frame";
import Chips from "./Chips";

const WARNA = { lewat: ["#2b3517", "#b5d36f"], berhenti: ["#4a2320", "#f08a7a"], lewati: ["#14160f", "#5c5e54"] } as const;
const small = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border-2 border-noir bg-zinc-800 text-sm font-bold disabled:opacity-40";

export default function FirewallNat({ title }: { title: string }) {
  const [id, setId] = useState(PAKET[0].label);
  const [rules, setRules] = useState<Rule[]>(DEFAULT_RULES);
  const [masq, setMasq] = useState(true);
  const [dstnat, setDstnat] = useState(false);
  const [pilih, setPilih] = useState(10);
  const p = PAKET.find((x) => x.label === id)!;
  const r = proses(p, rules, { masq, dstnat });
  const n = r.jalur.length, bw = 460 / n - 12;
  const geser = (i: number, d: number) => setRules((o) => { const c = [...o]; [c[i], c[i + d]] = [c[i + d], c[i]]; return c; });
  const baris = (nama: string, a: { src: typeof p.src; dst: typeof p.dst }) => (
    <div className="grid grid-cols-[5.5rem_1fr] gap-x-2 font-mono text-xs"><span className="text-zinc-400">{nama}</span><span className="break-all text-zinc-100">{fmtAddr(a.src)} <span className="text-zinc-500">-&gt;</span> {fmtAddr(a.dst)}</span></div>
  );

  return (
    <Frame title={title} hint="Pilih paket uji, lalu susun aturan firewall dan NAT. Paket diperiksa dari aturan teratas dan berhenti di aturan pertama yang cocok.">
      <Chips label="Paket uji" value={id} options={PAKET.map((x) => x.label)} onChange={setId} />
      <div className="sim-stage mt-3 p-3">
        <div className="overflow-x-auto"><svg viewBox="0 0 480 96" role="img" aria-label={`Jalur paket ${p.label}: ${r.jalur.map((t) => `${t.label} ${t.status}`).join(", ")}`} className="block w-full">
          {r.jalur.map((t, i) => {
            const bx = 6 + i * (460 / n) + 6, [fill, stroke] = WARNA[t.status];
            return (
              <g key={i}>
                {i > 0 && <path d={`M${bx - 11} 48h9m-3 -3l3 3l-3 3`} stroke="#8a8c80" fill="none" strokeWidth="1.5" />}
                <rect x={bx} y="14" width={bw} height="68" rx="10" fill={fill} stroke={stroke} strokeWidth="2" strokeDasharray={t.status === "lewati" ? "4 3" : undefined} />
                <text x={bx + bw / 2} y="42" textAnchor="middle" className="font-mono text-[12px] font-bold" fill="#f4f7ea">{t.label}</text>
                <text x={bx + bw / 2} y="60" textAnchor="middle" className="font-mono text-[9.5px]" fill="#bfc0b5">{t.detail}</text>
                {t.status === "berhenti" && <text x={bx + bw / 2} y="75" textAnchor="middle" className="font-mono text-[9.5px] font-bold" fill="#f08a7a">DROP</text>}
              </g>
            );
          })}
        </svg></div>
        <p aria-live="polite" className={`mt-2 min-h-12 text-sm font-bold ${r.hasil === "dibuang" ? "text-[#f08a7a]" : "text-matcha-300"}`}>{r.ringkas}</p>
        <div className="mt-2 grid gap-1 rounded-lg border border-zinc-700 p-2">
          {baris("sebelum", r.sebelum)}
          {baris(r.hasil === "dibuang" ? "dibuang di" : "sesudah", r.sesudah)}
        </div>
        {r.catatan.map((c) => <p key={c} className="mt-1 text-xs text-zinc-300">{c}</p>)}
      </div>
      <div role="group" aria-label="Aturan NAT" className="mt-3 flex flex-wrap gap-2">
        <button type="button" aria-pressed={masq} onClick={() => setMasq(!masq)} className={masq ? simButton : simGhost}>srcnat masquerade ether1</button>
        <button type="button" aria-pressed={dstnat} onClick={() => setDstnat(!dstnat)} className={dstnat ? simButton : simGhost}>dstnat port 80 ke 192.168.88.10</button>
      </div>
      <p className="mt-3 text-sm font-bold">Aturan filter (urut dari atas)</p>
      <ol aria-label="Aturan filter" className="sim-stage mt-1 grid gap-1 p-2">
        {rules.map((x, i) => (
          <li key={i} className={`flex flex-wrap items-center gap-1 rounded-xl border-2 p-1 pl-3 ${r.cocok === i ? "border-matcha-300 bg-[#2b3517]" : x.chain === r.chain ? "border-zinc-600" : "border-zinc-800 opacity-60"}`}>
            <span className="w-5 font-mono text-xs text-zinc-400">{i + 1}</span>
            <code className="min-w-0 flex-1 basis-48 break-all font-mono text-xs"><span className={x.aksi === "drop" ? "text-[#f08a7a]" : "text-matcha-300"}>{teksAturan(x)}</span></code>
            <button type="button" aria-label={`Naikkan aturan ${i + 1}`} disabled={i === 0} onClick={() => geser(i, -1)} className={small}>^</button>
            <button type="button" aria-label={`Turunkan aturan ${i + 1}`} disabled={i === rules.length - 1} onClick={() => geser(i, 1)} className={small}>v</button>
            <button type="button" aria-label={`Hapus aturan ${i + 1}`} onClick={() => setRules(rules.filter((_, j) => j !== i))} className={small}>x</button>
          </li>
        ))}
        {rules.length === 0 && <li className="text-xs text-zinc-400">Tidak ada aturan: semua paket diterima.</li>}
      </ol>
      <div className="mt-2 flex flex-wrap gap-2">
        <select aria-label="Aturan yang ditambahkan" value={pilih} onChange={(e) => setPilih(+e.target.value)} className="min-h-11 w-full min-w-0 rounded-full border-2 border-noir bg-zinc-800 px-3 font-mono text-xs sm:w-auto sm:flex-1">
          {TEMPLATE.map((t, i) => <option key={i} value={i}>{teksAturan(t)}</option>)}
        </select>
        <button type="button" onClick={() => setRules([...rules, TEMPLATE[pilih]])} className={simButton}>Tambah di akhir</button>
        <button type="button" onClick={() => setRules(DEFAULT_RULES)} className={simGhost}>Reset aturan</button>
      </div>
    </Frame>
  );
}
