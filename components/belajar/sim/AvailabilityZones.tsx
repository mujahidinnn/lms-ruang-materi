import { useState } from "react";
import { downtime, pick, percent, rate, verdict, ZONES } from "@/lib/sim/availability-zones";
import Frame, { simButton, simChip, simGhost } from "./Frame";

export default function AvailabilityZones({ title }: { title: string }) {
  const [deployed, setDeployed] = useState(1);
  const [up, setUp] = useState([true, true, true]);
  const [served, setServed] = useState([0, 0, 0]);
  const [ok, setOk] = useState(0);
  const [total, setTotal] = useState(0);
  const [turn, setTurn] = useState(0);
  const [last, setLast] = useState<{ z: number; n: number } | null>(null);

  function send(n: number) {
    const s = [...served];
    let t = turn, good = 0, lastZ = -2;
    for (let i = 0; i < n; i++) {
      const z = pick(deployed, up, t);
      lastZ = z;
      if (z >= 0) { s[z]!++; good++; t = z + 1; }
    }
    setServed(s); setTurn(t); setOk((x) => x + good); setTotal((x) => x + n);
    setLast((l) => ({ z: lastZ, n: (l?.n ?? 0) + 1 }));
  }
  const reset = () => { setServed([0, 0, 0]); setOk(0); setTotal(0); setLast(null); };
  const v = verdict(deployed, up);
  const downNow = up.slice(0, deployed).filter((x) => !x).length;

  return (
    <Frame title={title} hint="Pilih berapa zona yang dipakai, kirim request, lalu matikan satu zona. Bandingkan hasilnya untuk 1, 2, dan 3 zona.">
      <div className="sim-stage p-2 sm:p-4">
        <div className="mx-auto flex max-w-[16rem] items-center justify-center gap-2 rounded-xl border-2 border-[#b5d36f] bg-[#1d2014] px-3 py-2 text-center">
          <span aria-hidden className="text-lg text-[#b5d36f]">⬡</span>
          <span><span className="block text-sm font-extrabold">Load balancer</span><span className="block text-[11px] text-zinc-400">melayani lintas zona</span></span>
        </div>
        <div className="mt-1 grid grid-cols-3 gap-1.5 sm:gap-3">
          {ZONES.map((name, i) => {
            const used = i < deployed, alive = up[i]!, routable = used && alive;
            const flash = last?.z === i;
            return (
              <div key={name} className="min-w-0">
                <div aria-hidden className={`mx-auto h-5 w-0 border-l-2 border-dashed ${routable ? "border-[#b5d36f] sim-blink" : "border-zinc-700"}`} />
                <div className={`rounded-xl border-2 p-2 ${alive ? "border-zinc-600" : "border-red-400"} bg-black/30`}>
                  <p className="text-xs font-extrabold sm:text-sm">Zona {name}</p>
                  <p className={`text-[11px] font-bold ${alive ? "text-[#7ee081]" : "text-red-400"}`}>{alive ? "sehat" : "mati"}</p>
                  <div key={flash ? last!.n : "x"} className={`mt-2 rounded-lg border-2 px-1.5 py-2 text-center text-[11px] ${!used ? "border-dashed border-zinc-700 text-zinc-600" : routable ? `border-[#b5d36f] bg-[#1d2014] text-zinc-100 ${flash ? "sim-pop shadow-[0_0_12px_#b5d36f88]" : ""}` : "border-red-400/60 bg-[#1d2014] text-zinc-500 line-through"}`}>
                    {used ? <><span className="block font-bold">Server {name}</span><span className="block font-mono">{served[i]} req</span></> : "kosong"}
                  </div>
                  <button type="button" aria-pressed={!alive} aria-label={`${alive ? "Matikan" : "Hidupkan"} zona ${name}`} onClick={() => setUp((u) => u.map((x, k) => (k === i ? !x : x)))} className="mt-2 min-h-11 w-full rounded-lg bg-zinc-800 px-1 text-xs font-bold aria-pressed:ring-2 aria-pressed:ring-red-400">
                    {alive ? "Matikan" : "Hidupkan"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-1.5 text-center">
          <div className="rounded-xl bg-black/40 px-1 py-2"><dt className="text-[11px] text-zinc-400">Request berhasil</dt><dd className="font-mono text-base font-extrabold text-[#b5d36f]">{rate(ok, total)}<span className="block text-[10px] font-normal text-zinc-500">{ok}/{total}</span></dd></div>
          <div className="rounded-xl bg-black/40 px-1 py-2"><dt className="text-[11px] text-zinc-400">Ketersediaan {deployed} zona</dt><dd className="font-mono text-base font-extrabold">{percent(deployed)}</dd></div>
          <div className="rounded-xl bg-black/40 px-1 py-2"><dt className="text-[11px] text-zinc-400">Mati per tahun</dt><dd className="text-xs font-extrabold leading-5">{downtime(deployed)}</dd></div>
        </dl>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1" role="group" aria-label="Jumlah zona yang dipakai">
        <span className="px-2 text-sm text-zinc-400">deploy di:</span>
        {[1, 2, 3].map((n) => <button key={n} type="button" aria-pressed={deployed === n} onClick={() => { setDeployed(n); reset(); }} className={simChip}>{n} zona</button>)}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => send(1)} className={simButton}>Kirim request</button>
        <button type="button" onClick={() => send(20)} className={simGhost}>Kirim 20 request</button>
        <button type="button" onClick={() => { setUp([true, true, true]); reset(); }} className="min-h-11 px-2 text-sm text-zinc-400 underline underline-offset-2">Reset</button>
      </div>
      <p aria-live="polite" className="mt-3 text-sm text-zinc-400">
        {v === "mati" ? `Semua server mati: request gagal. ${deployed === 1 ? "Satu zona saja adalah titik lemah tunggal (single point of failure)." : "Semua zona yang dipakai gagal sekaligus."}`
          : deployed === 1 ? "Satu zona, satu server: itu titik lemah tunggal. Matikan zona A dan semua request gagal."
          : v === "spof" ? `Tinggal satu zona sehat${downNow ? `, ${downNow} zona mati` : ""}, tetapi layanan tetap hidup. Satu kegagalan lagi akan mematikannya.`
          : "Semua zona sehat. Matikan salah satu: load balancer langsung mengalihkan lalu lintas dan layanan tetap hidup."}
      </p>
    </Frame>
  );
}
