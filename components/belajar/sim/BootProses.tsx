import { useState } from "react";
import { type Proc, roundRobin } from "../../../lib/sim/scheduler";
import Frame, { simButton, simChip, simGhost } from "./Frame";

const STEPS = [
  { name: "POST", info: "Firmware memeriksa CPU, RAM, dan perangkat dasar.", ok: "Bunyi beep pendek, logo produsen muncul.", fail: "Layar hitam dan bunyi beep berulang. Pola beep menunjuk komponen rusak, sering RAM yang kurang rapat." },
  { name: "BIOS/UEFI", info: "Firmware mencari perangkat boot sesuai urutan boot.", ok: "Disk boot ditemukan.", fail: "No bootable device. Urutan boot salah, disk tidak terbaca, atau kabel longgar." },
  { name: "Bootloader", info: "GRUB atau Windows Boot Manager memuat kernel ke RAM.", ok: "Menu pilihan OS sekilas muncul.", fail: "grub rescue> atau Operating System not found. Konfigurasi bootloader rusak, biasanya setelah partisi diubah." },
  { name: "Kernel", info: "Kernel mengambil alih perangkat keras dan memuat driver.", ok: "Logo OS dan indikator memuat.", fail: "Kernel panic atau layar biru (BSOD). Driver bermasalah atau berkas sistem rusak." },
  { name: "Init", info: "Proses pertama (systemd, services) menjalankan layanan.", ok: "Layanan jaringan dan tampilan mulai aktif.", fail: "Emergency mode atau layanan gagal start. Sistem berhenti di prompt teks tanpa desktop." },
  { name: "Login", info: "Layar login tampil dan desktop siap dipakai.", ok: "Masukkan sandi, desktop terbuka.", fail: "Login berulang kali kembali ke layar login, atau layar hitam dengan kursor. Sering masalah driver grafis atau profil pengguna." },
];
const COLORS = ["#b5d36f", "#f2c879", "#8fc4e8"];

function Boot() {
  const [s, setS] = useState(0);
  const [fail, setFail] = useState(false);
  const cur = STEPS[s];
  return (
    <>
      <div className="sim-stage p-3 sm:p-4">
        <ol className="grid gap-1">
          {STEPS.map((st, i) => {
            const bad = fail && i === s;
            const state = bad ? "bg-[#e5736b] text-[#12140d]" : i === s ? "bg-[#b5d36f] text-[#12140d]" : i < s ? "bg-[#b5d36f]/15" : "bg-zinc-800/50 text-zinc-500";
            return (
              <li key={st.name}>
                <button type="button" aria-current={i === s ? "step" : undefined} aria-label={`Tahap ${i + 1}: ${st.name}`} onClick={() => setS(i)} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-bold transition-colors ${state}`}>
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-current text-xs">{bad ? "!" : i < s ? "✓" : i + 1}</span>
                  {st.name}
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-sm text-zinc-300">{cur.info}</p>
        <div className="sim-pop mt-2 rounded-xl bg-[#0a0c06] p-3 font-mono text-xs leading-5" key={`${s}${fail}`} style={{ color: fail ? "#f09a93" : "#e8efd6" }}>
          <p className="mb-1 font-sans text-zinc-400">{fail ? "Yang dilihat pengguna" : "Yang tampak di layar"}</p>
          {fail ? cur.fail : cur.ok}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={simGhost} disabled={s === 0} onClick={() => setS(s - 1)}>Sebelumnya</button>
        <button type="button" className={simButton} disabled={s === STEPS.length - 1 || fail} onClick={() => setS(s + 1)}>Tahap berikutnya</button>
        <button type="button" aria-pressed={fail} onClick={() => setFail(!fail)} className={`${simGhost} aria-pressed:!bg-[#e5736b] aria-pressed:!text-[#12140d]`}>Gagal di tahap ini</button>
      </div>
      <p aria-live="polite" className="mt-2 text-sm text-zinc-400">{fail ? `Boot berhenti di ${cur.name}. Tahap setelahnya tidak pernah berjalan.` : `Tahap ${s + 1} dari ${STEPS.length}.`}</p>
    </>
  );
}

function Scheduler() {
  const [bursts, setBursts] = useState([5, 3, 2]);
  const [q, setQ] = useState(2);
  const procs: Proc[] = bursts.map((burst, i) => ({ name: "ABC"[i], burst }));
  const { slices, stats, avgWaiting } = roundRobin(procs, q);
  const total = slices.at(-1)?.end ?? 1;
  const col = (name: string) => COLORS["ABC".indexOf(name)];
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {procs.map((p, i) => (
          <label key={p.name} className="grid gap-1 text-sm font-bold">
            <span><span style={{ color: col(p.name) }}>Proses {p.name}</span> butuh {p.burst} satuan waktu</span>
            <input type="range" min={1} max={8} value={p.burst} onChange={(e) => setBursts(bursts.map((b, k) => (k === i ? +e.target.value : b)))} className="min-h-11 w-full accent-[var(--color-matcha-400)]" />
          </label>
        ))}
        <label className="grid gap-1 text-sm font-bold">Jatah waktu (quantum): {q}
          <input type="range" min={1} max={8} value={q} onChange={(e) => setQ(+e.target.value)} className="min-h-11 w-full accent-[var(--color-matcha-400)]" />
        </label>
      </div>
      <div className="sim-stage mt-3 p-3 sm:p-4">
        <p className="mb-1 text-xs font-bold text-zinc-400">Giliran CPU (Gantt)</p>
        <div role="img" aria-label={`Urutan giliran CPU: ${slices.map((s) => `${s.name} ${s.start} sampai ${s.end}`).join(", ")}`} className="flex h-12 gap-px overflow-hidden rounded-lg">
          {slices.map((s, i) => (
            <div key={`${q}${bursts}${i}`} className="sim-pop grid place-items-center text-sm font-extrabold text-[#12140d]" style={{ width: `${((s.end - s.start) / total) * 100}%`, background: col(s.name) }}>{s.name}</div>
          ))}
        </div>
        <div className="relative mt-1 h-4 text-[10px] text-zinc-400" aria-hidden="true">
          {[0, ...slices.map((s) => s.end)].map((t, i) => <span key={i} className="absolute -translate-x-1/2" style={{ left: `${(t / total) * 100}%`, opacity: total > 14 && i % 2 ? 0 : 1 }}>{t}</span>)}
        </div>
        <table className="mt-3 w-full font-mono text-xs">
          <thead><tr className="text-left font-sans text-zinc-400"><th className="py-1">proses</th><th>burst</th><th>selesai</th><th>menunggu</th></tr></thead>
          <tbody>
            {stats.map((s) => <tr key={s.name}><td className="py-1 font-bold" style={{ color: col(s.name) }}>{s.name}</td><td>{s.burst}</td><td>{s.finish}</td><td>{s.waiting}</td></tr>)}
          </tbody>
        </table>
      </div>
      <p aria-live="polite" className="mt-3 text-sm text-zinc-300">Rata-rata waktu tunggu: <strong className="text-current">{avgWaiting.toFixed(1)}</strong>. {q >= Math.max(...bursts) ? "Quantum sebesar proses terpanjang membuat Round Robin sama dengan FCFS." : "Quantum kecil membuat giliran lebih adil, tetapi lebih sering berpindah proses."}</p>
    </>
  );
}

export default function BootProses({ title }: { title: string }) {
  const [tab, setTab] = useState<"boot" | "jadwal">("boot");
  return (
    <Frame title={title} hint="Telusuri tahap booting dan coba gagalkan salah satunya, lalu atur proses dan quantum untuk melihat penjadwalan Round Robin.">
      <div role="group" aria-label="Pilih simulasi" className="mb-3 flex gap-1 rounded-full bg-zinc-800 p-1">
        <button type="button" aria-pressed={tab === "boot"} onClick={() => setTab("boot")} className={`${simChip} flex-1`}>Urutan booting</button>
        <button type="button" aria-pressed={tab === "jadwal"} onClick={() => setTab("jadwal")} className={`${simChip} flex-1`}>Penjadwalan CPU</button>
      </div>
      {tab === "boot" ? <Boot /> : <Scheduler />}
    </Frame>
  );
}
