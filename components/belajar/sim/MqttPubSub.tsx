import { useEffect, useState } from "react";
import { matches } from "@/lib/sim/mqtt";
import Frame, { G, Glow, INK, reducedMotion, simButton } from "./Frame";

const TOPICS = ["rumah/dapur/suhu", "rumah/kamar/suhu", "rumah/dapur/asap"];
const FILTERS = ["rumah/dapur/suhu", "rumah/+/suhu", "rumah/dapur/#", "rumah/#"];
const SUB_Y = [55, 175];
type Sub = { name: string; filter: string; got: string[] };
type Flight = { id: number; topic: string; phase: 1 | 2 };

export default function MqttPubSub({ title }: { title: string }) {
  const [subs, setSubs] = useState<Sub[]>([
    { name: "Aplikasi HP", filter: "rumah/+/suhu", got: [] },
    { name: "Alarm dapur", filter: "rumah/dapur/#", got: [] },
  ]);
  const [last, setLast] = useState<{ topic: string; hit: boolean[] } | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);

  useEffect(() => {
    if (flight?.phase !== 1) return;
    const t = setTimeout(() => setFlight((f) => f && { ...f, phase: 2 }), 650);
    return () => clearTimeout(t);
  }, [flight]);

  function publish(topic: string) {
    const hit = subs.map((s) => matches(s.filter, topic));
    setSubs(subs.map((s, i) => (hit[i] ? { ...s, got: [topic, ...s.got].slice(0, 3) } : s)));
    setLast({ topic, hit });
    if (!reducedMotion()) setFlight((f) => ({ id: (f?.id ?? 0) + 1, topic, phase: 1 }));
  }

  return (
    <Frame title={title} hint="Publisher tidak tahu siapa yang mendengar. Kirim sebuah topik, lalu ubah filter pelanggan dan lihat siapa yang menerima.">
      <div className="sim-stage p-2 sm:p-4">
        <svg viewBox="0 0 400 230" role="img" aria-label="Sensor mengirim pesan ke broker, broker meneruskan ke pelanggan yang filternya cocok" className="h-auto w-full">
          <Glow />
          <path d="M78 115H150" stroke={G} strokeWidth="2" strokeDasharray="4 5" fill="none" className="sim-flow" />
          {SUB_Y.map((y, i) => <path key={i} d={`M250 115C285 115 285 ${y} 300 ${y}`} fill="none" strokeWidth="2" strokeDasharray="4 5" stroke={last?.hit[i] === false ? "#5b5f52" : G} className={last?.hit[i] === false ? "" : "sim-flow"} />)}

          {/* publisher: thermometer sensor */}
          <rect x="22" y="87" width="56" height="56" rx="14" fill="#1d2014" stroke="#e8efd6" strokeWidth="2" />
          <rect x="46" y="97" width="8" height="26" rx="4" fill="none" stroke="#e8efd6" strokeWidth="2" />
          <circle cx="50" cy="128" r="7" fill={G} />
          <rect x="48.5" y="108" width="3" height="18" rx="1.5" fill={G} />
          <text x="50" y="160" fontSize="11" fontWeight="700" textAnchor="middle" fill="#f4f7ea">Publisher</text>

          {/* broker hub */}
          <g filter="url(#simglow)"><circle cx="200" cy="115" r="42" fill="none" stroke={G} strokeWidth="1.5" opacity="0.5" /><circle cx="200" cy="115" r="30" fill="url(#simhex)" stroke={INK} strokeWidth="3" /></g>
          <path d="M188 115h24M200 103v24M191 106l18 18M209 106l-18 18" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <text x="200" y="172" fontSize="11" fontWeight="700" textAnchor="middle" fill="#f4f7ea">Broker</text>

          {/* subscribers */}
          {subs.map((s, i) => {
            const y = SUB_Y[i];
            const hit = last?.hit[i];
            return (
              <g key={s.name} opacity={hit === false ? 0.55 : 1}>
                <rect x="300" y={y - 26} width="96" height="52" rx="12" fill="#1d2014" stroke={hit ? G : "#6b7058"} strokeWidth="2" filter={hit ? "url(#simglow)" : undefined} className={hit ? "sim-pop" : ""} />
                <text x="348" y={y - 8} fontSize="10.5" fontWeight="700" textAnchor="middle" fill="#f4f7ea">{s.name}</text>
                <text x="348" y={y + 6} fontSize="8" textAnchor="middle" fill="#a9b08f" fontFamily="monospace">{s.filter}</text>
                <text x="348" y={y + 19} fontSize="9" fontWeight="700" textAnchor="middle" fill={hit ? G : "#f87171"}>{last ? (hit ? "✓ diterima" : "✕ tidak cocok") : "menunggu"}</text>
              </g>
            );
          })}

          {/* the message in flight */}
          {flight?.phase === 1 && (
            <g key={`${flight.id}a`} filter="url(#simglow)">
              <rect x="-13" y="-8" width="26" height="16" rx="8" fill={G} stroke={INK} strokeWidth="1.5"><animateMotion dur="0.6s" fill="freeze" path="M78 115H200" /></rect>
            </g>
          )}
          {flight?.phase === 2 && last?.hit.map((h, i) => h && (
            <g key={`${flight.id}b${i}`} filter="url(#simglow)">
              <rect x="-13" y="-8" width="26" height="16" rx="8" fill={G} stroke={INK} strokeWidth="1.5"><animateMotion dur="0.6s" fill="freeze" path={`M200 115L250 115C285 115 285 ${SUB_Y[i]} 300 ${SUB_Y[i]}`} /></rect>
            </g>
          ))}
        </svg>
        <p className="-mt-1 text-center font-mono text-xs text-[#a9b08f]">{last ? `topik: ${last.topic}` : "Pilih topik di bawah untuk mengirim pesan"}</p>
      </div>

      <p className="mt-3 text-sm font-bold">Kirim pesan ke topik:</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {TOPICS.map((t) => <button key={t} type="button" onClick={() => publish(t)} className={`${simButton} font-mono`}>{t}</button>)}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {subs.map((s, i) => (
          <div key={s.name} className={`rounded-2xl bg-zinc-800 p-3 ${last?.hit[i] ? "ring-2 ring-matcha-400" : ""}`}>
            <label className="grid gap-1 text-xs font-bold">Filter {s.name}
              <select value={s.filter} onChange={(e) => { setSubs(subs.map((x, k) => (k === i ? { ...x, filter: e.target.value, got: [] } : x))); setLast(null); }} className="min-h-11 rounded-xl border-2 border-noir bg-zinc-900 px-2 font-mono text-sm text-inherit">
                {FILTERS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </label>
            <p className="mt-2 text-xs text-zinc-400" aria-live="polite">{s.got.length ? `Diterima: ${s.got.join(" · ")}` : "Belum ada pesan yang cocok."}</p>
          </div>
        ))}
      </div>
    </Frame>
  );
}
