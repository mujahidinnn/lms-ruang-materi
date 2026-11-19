import { useEffect, useRef, useState } from "react";
import { pick, type Algo, type Backend } from "@/lib/sim/load-balancer";
import Frame, { G, Glow, INK, reducedMotion, simButton, simChip } from "./Frame";

const Y = [45, 125, 205];
const LIFETIME = 3000;
type Packet = { id: number; to: number };

export default function LoadBalancer({ title }: { title: string }) {
  const [servers, setServers] = useState<Backend[]>([0, 1, 2].map(() => ({ up: true, active: 0 })));
  const [served, setServed] = useState([0, 0, 0]);
  const [algo, setAlgo] = useState<Algo>("round-robin");
  const [auto, setAuto] = useState(false);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [lost, setLost] = useState(0);
  const live = useRef({ servers, algo, turn: 0, id: 0 });
  useEffect(() => { live.current.servers = servers; live.current.algo = algo; });

  function send() {
    const c = live.current;
    const to = pick(c.algo, c.servers, c.turn);
    if (to < 0) return setLost((n) => n + 1);
    c.turn = to + 1;
    const id = ++c.id;
    const bump = (d: number) => setServers((s) => s.map((x, i) => (i === to ? { ...x, active: Math.max(0, x.active + d) } : x)));
    bump(1);
    setServed((s) => s.map((n, i) => (i === to ? n + 1 : n)));
    if (!reducedMotion()) {
      setPackets((p) => [...p, { id, to }]);
      setTimeout(() => setPackets((p) => p.filter((x) => x.id !== id)), 900);
    }
    setTimeout(() => bump(-1), LIFETIME);
  }

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(send, 700);
    return () => clearInterval(t);
  }, [auto]);

  const anyUp = servers.some((s) => s.up);

  return (
    <Frame title={title} hint="Tekan Kirim request, ganti algoritmanya, lalu matikan satu server dan lihat ke mana lalu lintas pergi.">
      <div className="sim-stage p-2 sm:p-4">
        <svg viewBox="0 0 400 250" role="img" aria-label="Klien mengirim request ke load balancer, yang meneruskannya ke tiga server" className="h-auto w-full">
          <Glow />
          {/* wires */}
          <path d="M72 125H154" stroke={G} strokeWidth="2" strokeDasharray="4 5" fill="none" className="sim-flow" />
          {Y.map((y, i) => (
            <path key={i} d={`M206 125C250 125 250 ${y} 290 ${y}`} fill="none" strokeWidth="2" strokeDasharray="4 5" stroke={servers[i].up ? G : "#5b5f52"} className={servers[i].up ? "sim-flow" : ""} />
          ))}

          {/* client laptop */}
          <g>
            <rect x="18" y="106" width="46" height="30" rx="4" fill="#1d2014" stroke="#e8efd6" strokeWidth="2" />
            <rect x="24" y="112" width="34" height="3" rx="1.5" fill={G} /><rect x="24" y="119" width="22" height="3" rx="1.5" fill="#6b7058" /><rect x="24" y="126" width="28" height="3" rx="1.5" fill="#6b7058" />
            <path d="M10 143H72" stroke="#e8efd6" strokeWidth="4" strokeLinecap="round" />
            <text x="41" y="166" fontSize="11" fontWeight="700" textAnchor="middle" fill="#f4f7ea">Klien</text>
          </g>

          {/* balancer */}
          <g filter="url(#simglow)">
            <polygon points="180,93 208,109 208,141 180,157 152,141 152,109" fill="url(#simhex)" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          </g>
          <path d="M166 125H180M180 125L194 112M180 125H194M180 125L194 138" stroke={INK} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <text x="180" y="176" fontSize="11" fontWeight="700" textAnchor="middle" fill="#f4f7ea">Load balancer</text>

          {/* servers */}
          {Y.map((y, i) => {
            const s = servers[i];
            return (
              <g key={i} opacity={s.up ? 1 : 0.5}>
                <rect x="290" y={y - 25} width="104" height="50" rx="10" fill="#1d2014" stroke={s.up ? (s.active > 0 ? G : "#6b7058") : "#f87171"} strokeWidth="2" filter={s.up && s.active > 0 ? "url(#simglow)" : undefined} />
                <circle cx="304" cy={y - 11} r="3.5" fill={s.up ? "#7ee081" : "#f87171"} className={s.up ? "sim-blink" : ""} />
                <text x="314" y={y - 7} fontSize="10.5" fontWeight="700" fill="#f4f7ea">Server {i + 1}</text>
                <rect x="298" y={y + 1} width="88" height="3" rx="1.5" fill="#2c3020" />
                {s.up && Array.from({ length: 6 }, (_, k) => <rect key={k} x={298 + k * 15} y={y + 9} width="12" height="8" rx="2" fill={s.up && k < s.active ? G : "#2c3020"} />)}
                {!s.up && <text x="342" y={y + 17} fontSize="11" fontWeight="800" textAnchor="middle" fill="#f87171">MATI</text>}
              </g>
            );
          })}

          {/* in-flight requests */}
          {packets.map((p) => (
            <g key={p.id} filter="url(#simglow)">
              <circle r="6" fill={G} stroke={INK} strokeWidth="1.5">
                <animateMotion dur="0.8s" fill="freeze" path={`M72 125H180L206 125C250 125 250 ${Y[p.to]} 290 ${Y[p.to]}`} />
              </circle>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {servers.map((s, i) => (
          <button key={i} type="button" aria-pressed={!s.up} onClick={() => setServers((all) => all.map((x, k) => (k === i ? { up: !x.up, active: x.up ? 0 : x.active } : x)))} className="flex min-h-11 items-center justify-between gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-left text-sm aria-pressed:ring-2 aria-pressed:ring-red-400">
            <span><span className="font-bold">Server {i + 1}</span><span className="block text-xs text-zinc-400">{served[i]} request dilayani</span></span>
            <span className="text-xs font-bold underline underline-offset-2">{s.up ? "Matikan" : "Hidupkan"}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={send} className={simButton}>Kirim request</button>
        <button type="button" aria-pressed={auto} onClick={() => setAuto((a) => !a)} className={`${simButton} aria-pressed:bg-noir aria-pressed:text-on-noir`}>{auto ? "Hentikan lalu lintas" : "Lalu lintas otomatis"}</button>
        <div role="group" aria-label="Algoritma" className="inline-flex rounded-full border-2 border-noir bg-zinc-800 p-1">
          <button type="button" aria-pressed={algo === "round-robin"} onClick={() => setAlgo("round-robin")} className={simChip}>Round robin</button>
          <button type="button" aria-pressed={algo === "least-connections"} onClick={() => setAlgo("least-connections")} className={simChip}>Koneksi tersedikit</button>
        </div>
        <button type="button" onClick={() => { setServed([0, 0, 0]); setLost(0); }} className="min-h-11 px-2 text-sm text-zinc-400 underline underline-offset-2">Reset hitungan</button>
      </div>
      <p aria-live="polite" className="mt-3 text-sm text-zinc-400">
        {!anyUp ? "Semua server mati: request gagal. Inilah alasan satu server saja adalah titik lemah." : lost > 0 ? `${lost} request gagal karena tidak ada server hidup.` : algo === "round-robin" ? "Round robin bergiliran, tanpa melihat siapa yang sibuk." : "Koneksi tersedikit memilih server yang paling lengang."}
      </p>
    </Frame>
  );
}
