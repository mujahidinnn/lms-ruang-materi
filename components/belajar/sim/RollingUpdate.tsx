import { useEffect, useState } from "react";
import { awal, langkah, rollback, status, valid, type Cfg, type State } from "@/lib/sim/rolling-update";
import Chips from "./Chips";
import Frame, { reducedMotion, simButton, simGhost } from "./Frame";

const REPLICAS = [2, 3, 4, 5, 6] as const;
const ANGKA = [0, 1, 2, 3] as const;

export default function RollingUpdate({ title }: { title: string }) {
  const [replicas, setReplicas] = useState<number>(4);
  const [maxSurge, setSurge] = useState<number>(1);
  const [maxUnavailable, setUnavail] = useState<number>(0);
  const [rusak, setRusak] = useState(false);
  const [hist, setHist] = useState<State[]>(() => [awal(4)]);
  const [putar, setPutar] = useState(false);
  const cfg: Cfg = { replicas, maxSurge, maxUnavailable: Math.min(maxUnavailable, replicas) };
  const s = hist[hist.length - 1];
  const st = status(cfg, s);
  const ok = valid(cfg);
  const berhenti = st.selesai || st.macet || !ok;

  const reset = (r = replicas, bad = rusak) => { setPutar(false); setHist([awal(r, bad)]); };
  const maju = () => setHist((h) => [...h, langkah(cfg, h[h.length - 1])]);
  useEffect(() => {
    if (!putar) return;
    if (berhenti) { setPutar(false); return; }
    const t = setTimeout(maju, 900);
    return () => clearTimeout(t);
  });

  const target = s.target;
  const pesan = !ok
    ? "maxSurge dan maxUnavailable tidak boleh keduanya 0: tidak ada ruang untuk mengganti Pod."
    : st.mati ? "layanan mati: tidak ada Pod siap."
    : st.macet ? `rollout macet: Pod v2 tidak pernah siap. Kubernetes berhenti di batas minimum (${st.ready} siap). tekan rollback.`
    : st.selesai ? `selesai: semua ${cfg.replicas} Pod sudah v${target} dan siap.`
    : st.turun ? `kapasitas turun: ${st.ready} dari ${cfg.replicas} Pod siap. batas minimum ${st.minReady}.`
    : `kapasitas penuh: ${st.ready} Pod siap. batas minimum ${st.minReady}, maksimum ${st.maxTotal} Pod.`;
  const bahaya = st.mati || st.macet || !ok;
  const kuning = !bahaya && st.turun && !st.selesai;

  return (
    <Frame title={title} hint="Atur replicas, maxSurge, dan maxUnavailable, lalu tekan Langkah atau Putar. Nyalakan 'v2 rusak' untuk melihat rollout macet, lalu coba rollback.">
      <div className="sim-stage p-3">
        <div role="img" aria-label={`Deret Pod: ${s.pods.map((p) => `v${p.v} ${p.ready ? "siap" : "belum siap"}`).join(", ")}`} className="flex min-h-24 flex-wrap items-center justify-center gap-2 py-2">
          {s.pods.map((p, i) => (
            <div key={i} className={`flex h-16 w-[4.75rem] flex-col items-center justify-center rounded-xl border-2 text-center text-xs font-bold font-mono ${reducedMotion() ? "" : "transition-colors"} ${p.v === 1 ? "border-[#8b8d81]" : "border-[#b5d36f]"} ${p.ready ? (p.v === 1 ? "bg-[#3c3e36] text-zinc-100" : "bg-[#b5d36f] text-[#12140d]") : "border-dashed bg-transparent text-zinc-300"}`}>
              <span className="text-base">v{p.v}</span>
              <span className="text-[10px] font-normal">{p.ready ? "siap" : "belum siap"}</span>
            </div>
          ))}
        </div>
        <dl className="mt-1 grid grid-cols-3 gap-2 text-center">
          {([["siap", st.ready], ["minimum", st.minReady], ["maks pod", st.maxTotal]] as const).map(([l, v]) => (
            <div key={l} className="rounded-xl bg-zinc-800 p-2"><dt className="text-xs text-zinc-300">{l}</dt><dd className="font-mono text-lg font-bold">{v}</dd></div>
          ))}
        </dl>
        <p aria-live="polite" className={`mt-3 min-h-12 rounded-xl p-2 text-center text-sm font-bold ${bahaya ? "bg-[#5a1f1a] text-[#ffb4a8]" : kuning ? "bg-[#4d3a10] text-[#ffd98a]" : "text-zinc-300"}`}>{pesan}</p>
        <p className="mt-2 text-center font-mono text-xs text-zinc-300">pod siap per langkah: {hist.map((h) => status(cfg, h).ready).join(" → ")}</p>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Chips label="replicas" value={replicas} options={REPLICAS} onChange={(v) => { setReplicas(v); setUnavail((u) => Math.min(u, v)); reset(v); }} />
        <Chips label="maxSurge" value={maxSurge} options={ANGKA} onChange={(v) => { setSurge(v); reset(); }} />
        <Chips label="maxUnavailable" value={maxUnavailable} options={ANGKA} onChange={(v) => { setUnavail(v); reset(); }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={berhenti || putar} onClick={maju} className={simButton}>Langkah</button>
        <button type="button" disabled={berhenti} aria-pressed={putar} onClick={() => setPutar((v) => !v)} className={simButton}>{putar ? "Jeda" : "Putar"}</button>
        <button type="button" disabled={hist.length === 1} onClick={() => { setPutar(false); setHist((h) => [...h, rollback(h[h.length - 1])]); }} className={simGhost}>{target === 2 ? "Rollback" : "Perbarui lagi ke v2"}</button>
        <button type="button" aria-pressed={rusak} onClick={() => { setRusak((v) => !v); reset(replicas, !rusak); }} className={simGhost}>v2 rusak: {rusak ? "ya" : "tidak"}</button>
        <button type="button" onClick={() => reset()} className={simGhost}>Ulang</button>
      </div>
    </Frame>
  );
}
