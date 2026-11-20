import { useState } from "react";
import { dns, DNS_NODE, tcp, TCP_NODE, type Hilang } from "@/lib/sim/dns-tcp-handshake";
import Frame, { simButton, simGhost } from "./Frame";
import Chips from "./Chips";

const TAB = ["DNS lookup", "TCP handshake"] as const;
const HILANG: readonly Hilang[] = ["tidak ada", "SYN", "data"];
const W = 520, X0 = 60, TOP = 52;

export default function DnsTcpHandshake({ title }: { title: string }) {
  const [tab, setTab] = useState<(typeof TAB)[number]>("DNS lookup");
  const [cache, setCache] = useState(false);
  const [hilang, setHilang] = useState<Hilang>("tidak ada");
  const [n, setN] = useState(0);
  const isDns = tab === "DNS lookup";
  const steps = isDns ? dns(cache) : tcp(hilang);
  const node: readonly string[] = isDns ? DNS_NODE : TCP_NODE;
  const row = isDns ? 32 : 30;
  const H = TOP + 12 + 11 * row;
  const x = (i: number) => X0 + (i * (W - 2 * X0)) / (node.length - 1);
  const cur = n > 0 ? steps[n - 1] : null;
  const ubah = (f: () => void) => { f(); setN(0); };

  return (
    <Frame title={title} hint="Jalankan langkah demi langkah. Di DNS, coba cache hit. Di TCP, jatuhkan satu paket dan lihat retransmisinya.">
      <Chips label="Protokol" value={tab} options={TAB} onChange={(v) => ubah(() => setTab(v))} />
      <div className="sim-stage mt-3 p-3">
        <div className="overflow-x-auto"><svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={isDns ? "Diagram urutan pertanyaan DNS antara klien, resolver, root, TLD, dan server otoritatif" : "Diagram urutan paket TCP antara klien dan server"} className="block w-full">
          <defs>
            <marker id="dt-a" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="context-stroke" /></marker>
          </defs>
          {node.map((nama, i) => (
            <g key={nama}>
              <text x={x(i)} y="18" textAnchor="middle" className="fill-zinc-200 font-mono text-[11px] font-bold">{nama}</text>
              <line x1={x(i)} y1="28" x2={x(i)} y2={H - 4} stroke="#5c5e54" strokeDasharray="3 4" />
            </g>
          ))}
          {steps.slice(0, n).map((st, i) => {
            const y = TOP + i * row, a = x(st.dari), b = x(st.ke), last = i === n - 1;
            const warna = st.hilang ? "#f08a7a" : st.timeout ? "#fcd34d" : last ? "#b5d36f" : "#7d8a5a";
            const mid = (a + b) / 2;
            if (st.dari === st.ke) {
              return (
                <g key={i}>
                  <circle cx={a} cy={y} r="5" fill={warna} />
                  <text x={a + 12} y={y + 4} className="font-mono text-[10px]" fill={warna}>{st.label}</text>
                </g>
              );
            }
            const ujung = st.hilang ? a + (b - a) * 0.6 : b;
            return (
              <g key={i} stroke={warna} fill={warna}>
                <line x1={a} y1={y} x2={ujung} y2={y} strokeWidth={last ? 2.5 : 1.8} strokeDasharray={st.hilang ? "5 4" : undefined} markerEnd={st.hilang ? undefined : "url(#dt-a)"} />
                {st.hilang && <path d={`M${ujung - 5} ${y - 5}l10 10m0-10l-10 10`} strokeWidth="2.5" fill="none" />}
                <text x={mid} y={y - 6} textAnchor="middle" stroke="none" className="font-mono text-[10px]">{st.label}</text>
              </g>
            );
          })}
        </svg></div>
        <p aria-live="polite" className="mt-2 min-h-14 text-sm text-zinc-300">
          {cur ? `Langkah ${n} dari ${steps.length}: ${cur.teks}` : "Tekan Langkah berikut untuk memulai."}
        </p>
        {!isDns && (
          <p className="font-mono text-xs text-zinc-400">klien: <b className="text-zinc-100">{cur?.k ?? "CLOSED"}</b> · server: <b className="text-zinc-100">{cur?.s ?? "LISTEN"}</b></p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={n >= steps.length} onClick={() => setN(n + 1)} className={simButton}>Langkah berikut</button>
        <button type="button" disabled={n === 0} onClick={() => setN(n - 1)} className={simGhost}>Mundur</button>
        <button type="button" disabled={n === 0} onClick={() => setN(0)} className={simGhost}>Ulangi</button>
      </div>
      <div className="mt-3">
        {isDns ? (
          <button type="button" aria-pressed={cache} onClick={() => ubah(() => setCache(!cache))} className={cache ? simButton : simGhost}>Cache resolver sudah berisi example.com</button>
        ) : (
          <Chips label="Paket yang hilang" value={hilang} options={HILANG} onChange={(v) => ubah(() => setHilang(v))} />
        )}
      </div>
    </Frame>
  );
}
