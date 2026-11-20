import { useEffect, useState } from "react";
import { awal, endpoints, kirim, matikan, nama, perluTick, tick, type Pod, type State } from "@/lib/sim/service-pod";
import Chips from "./Chips";
import Frame, { simButton, simGhost } from "./Frame";

const REPL = [2, 3, 4] as const;
const WARNA: Record<Pod["status"], string> = { siap: "#b5d36f", mulai: "#f0b36a", mati: "#ff8a78" };
const KET: Record<Pod["status"], string> = { siap: "siap", mulai: "menyiapkan", mati: "mati" };

export default function ServicePod({ title }: { title: string }) {
  const [s, setS] = useState<State>(() => awal(3));
  const maks = Math.max(1, ...s.pods.map((p) => p.hits));
  const ep = endpoints(s);
  const H = 28 + s.pods.length * 56;

  useEffect(() => {
    if (!perluTick(s)) return;
    const t = setTimeout(() => setS(tick), 1400);
    return () => clearTimeout(t);
  }, [s]);

  const kirimN = (n: number) => setS((o) => { for (let i = 0; i < n; i++) o = kirim(o); return o; });
  const mati = s.pods.filter((p) => p.status === "mati").length;
  const mulai = s.pods.filter((p) => p.status === "mulai").length;
  const info = ep.length === 0
    ? "tidak ada endpoint siap: request gagal."
    : mati ? "pod mati sudah keluar dari endpoints. Deployment melihat jumlah Pod kurang dari replicas..."
    : mulai ? "Deployment membuat Pod baru. Pod belum masuk endpoints sampai lolos readiness probe."
    : `${ep.length} endpoint siap. Service membagi request bergiliran.`;

  return (
    <Frame title={title} hint="Kirim request, lalu matikan satu Pod. Perhatikan Service berhenti mengirim ke sana dan Deployment membuat Pod pengganti.">
      <div className="sim-stage p-3">
        <svg viewBox={`0 0 480 ${H}`} role="img" aria-label={`Service web membagi request ke ${ep.length} Pod siap dari ${s.pods.length}`} className="mx-auto block w-full max-w-xl">
          <rect x="6" y={H / 2 - 22} width="64" height="44" rx="10" fill="#2a2c25" stroke="#8b8d81" strokeWidth="1.5" />
          <text x="38" y={H / 2 + 4} textAnchor="middle" className="fill-zinc-100 text-[11px] font-bold">klien</text>
          <line x1="70" y1={H / 2} x2="122" y2={H / 2} stroke="#8b8d81" strokeWidth="2" />
          <rect x="122" y={H / 2 - 28} width="86" height="56" rx="12" fill="#b5d36f" stroke="#12140d" strokeWidth="2" />
          <text x="165" y={H / 2 - 4} textAnchor="middle" fill="#12140d" className="text-[12px] font-extrabold">Service</text>
          <text x="165" y={H / 2 + 12} textAnchor="middle" fill="#12140d" className="font-mono text-[10px]">web:80</text>
          {s.pods.map((p, i) => {
            const y = 14 + i * 56;
            const cy = y + 24;
            const aktif = p.id === s.last;
            return (
              <g key={p.id}>
                <line x1="208" y1={H / 2} x2="262" y2={cy} stroke={p.status === "siap" ? "#b5d36f" : "#5c5e54"} strokeWidth={aktif ? 4 : 2} strokeDasharray={p.status === "siap" ? undefined : "4 4"} />
                <rect x="262" y={y} width="212" height="48" rx="10" fill="#191a16" stroke={WARNA[p.status]} strokeWidth="2" strokeDasharray={p.status === "siap" ? undefined : "5 3"} />
                <text x="272" y={y + 18} className="fill-zinc-100 font-mono text-[11px] font-bold">{nama(p.id)}</text>
                <text x="464" y={y + 18} textAnchor="end" fill={WARNA[p.status]} className="text-[10px] font-bold">{KET[p.status]}</text>
                <rect x="272" y={y + 28} width="140" height="8" rx="4" fill="#3c3e36" />
                <rect x="272" y={y + 28} width={(p.hits / maks) * 140} height="8" rx="4" fill="#b5d36f" />
                <text x="420" y={y + 36} className="fill-zinc-100 font-mono text-[10px]">{p.hits} req</text>
              </g>
            );
          })}
        </svg>
        <p aria-live="polite" className="mt-2 min-h-12 text-center text-sm text-zinc-300">{info}</p>
        <p className="text-center font-mono text-xs text-zinc-300">terkirim {s.sent} · gagal {s.gagal}</p>
      </div>
      <div className="mt-3 grid gap-2">
        <Chips label="replicas" value={s.replicas} options={REPL} onChange={(v) => setS(awal(v))} />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => kirimN(1)} className={simButton}>Kirim 1 request</button>
          <button type="button" onClick={() => kirimN(10)} className={simButton}>Kirim 10</button>
          <button type="button" onClick={() => setS(awal(s.replicas))} className={simGhost}>Ulang</button>
        </div>
        <div role="group" aria-label="Matikan Pod" className="flex flex-wrap gap-2">
          {s.pods.map((p) => (
            <button key={p.id} type="button" disabled={p.status !== "siap"} onClick={() => setS((o) => matikan(o, p.id))} className={simGhost}>Matikan {nama(p.id)}</button>
          ))}
        </div>
      </div>
    </Frame>
  );
}
