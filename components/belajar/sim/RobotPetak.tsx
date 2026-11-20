import { useEffect, useState } from "react";
import { jalankan, LEVELS, MULAI, namaItem, pesan, type Item } from "@/lib/sim/robot-petak";
import Frame, { reducedMotion, simButton, simGhost } from "./Frame";
import Chips, { snippet } from "./Chips";

const C = 56;
const ROT = { atas: 0, kanan: 90, bawah: 180, kiri: 270 } as const;
const BARIS = (p: Item[]) => p.map((i) => (typeof i === "string" ? i.toUpperCase().replace("KIRI", "BELOK KIRI").replace("KANAN", "BELOK KANAN") : `ULANGI ${i.ulang} KALI: MAJU`)).join("\n");

export default function RobotPetak({ title }: { title: string }) {
  const [lv, setLv] = useState(0);
  const [prog, setProg] = useState<Item[]>([]);
  const [n, setN] = useState<2 | 3 | 4>(3);
  const [tick, setTick] = useState<number | null>(null); // null: belum dijalankan
  const l = LEVELS[lv];
  const run = tick === null ? null : jalankan(l, prog);
  const selesai = run !== null && tick! >= run.langkah;
  const pose = run ? run.jejak[Math.min(tick!, run.langkah)] : MULAI;
  const jalan = run !== null && !selesai;

  useEffect(() => {
    if (!jalan) return;
    const t = setTimeout(() => setTick((v) => v! + 1), 420);
    return () => clearTimeout(t);
  }, [jalan, tick]);

  const ubah = (p: Item[]) => { setProg(p); setTick(null); };
  const pilihLevel = (v: string) => { setLv(LEVELS.findIndex((x) => x.nama === v)); setProg([]); setTick(null); };
  const tambah = (i: Item) => prog.length < l.maksItem && ubah([...prog, i]);
  const mulai = () => setTick(reducedMotion() ? jalankan(l, prog).langkah : 0);
  const px = (x: number) => x * C;
  const py = (y: number) => (l.ukuran - 1 - y) * C;
  const hasil = selesai ? pesan(run!.hasil, run!.langkah, pose) : jalan ? "Robot berjalan..." : `Mulai di (0, 0) menghadap atas. Tujuan di (${l.tujuan[0]}, ${l.tujuan[1]}). Batu: ${l.batu.map(([x, y]) => `(${x}, ${y})`).join(", ")}.`;
  const warnaHasil = selesai ? (run!.hasil === "sukses" ? "text-matcha-300" : run!.hasil === "belum" ? "text-zinc-300" : "text-[#f08a7a]") : "text-zinc-300";
  const lintasan = run ? run.jejak.slice(0, Math.min(tick!, run.langkah) + 1) : [];

  return (
    <Frame title={title} hint="Susun perintah, tekan Jalankan, lalu lihat robot menurutinya persis apa adanya. Salah? Perbaiki urutannya (debugging).">
      <Chips label="Level" value={l.nama} options={LEVELS.map((x) => x.nama)} onChange={pilihLevel} />
      <p className="mt-2 text-sm text-zinc-300">{l.soal}</p>
      <div className="sim-stage mt-3 p-3">
        <svg viewBox={`0 0 ${l.ukuran * C} ${l.ukuran * C}`} role="img" aria-label={`Papan ${l.ukuran} kali ${l.ukuran}. Robot di (${pose.x}, ${pose.y}) menghadap ${pose.arah}. Bintang di (${l.tujuan[0]}, ${l.tujuan[1]}).`} className="mx-auto block w-full max-w-[320px]">
          {Array.from({ length: l.ukuran * l.ukuran }, (_, i) => {
            const x = i % l.ukuran, y = Math.floor(i / l.ukuran);
            return <rect key={i} x={px(x)} y={py(y)} width={C} height={C} fill={(x + y) % 2 ? "#1b1d14" : "#22251a"} stroke="#3a3d30" />;
          })}
          {lintasan.map((p, i) => <rect key={i} x={px(p.x) + 8} y={py(p.y) + 8} width={C - 16} height={C - 16} rx="8" fill="#b5d36f" fillOpacity={0.18} />)}
          {l.batu.map(([x, y]) => (
            <g key={`${x}${y}`}><polygon points={`${px(x) + 10},${py(y) + 46} ${px(x) + 14},${py(y) + 18} ${px(x) + 30},${py(y) + 10} ${px(x) + 46},${py(y) + 24} ${px(x) + 44},${py(y) + 46}`} fill="#5c5e54" stroke="#bfc0b5" strokeWidth="1.5" /></g>
          ))}
          <polygon transform={`translate(${px(l.tujuan[0]) + 28} ${py(l.tujuan[1]) + 30})`} points="0,-18 5,-6 18,-5 8,4 11,17 0,10 -11,17 -8,4 -18,-5 -5,-6" fill="#ffd84d" stroke="#12140d" strokeWidth="1.5" />
          <g transform={`translate(${px(pose.x) + 28} ${py(pose.y) + 28}) rotate(${ROT[pose.arah]})`} style={{ transition: reducedMotion() ? "none" : "transform 0.35s" }}>
            <rect x="-15" y="-13" width="30" height="28" rx="7" fill="#d6ea9c" stroke="#12140d" strokeWidth="2" />
            <polygon points="0,-24 -9,-12 9,-12" fill="#b5d36f" stroke="#12140d" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="-6" cy="-3" r="2.5" fill="#12140d" /><circle cx="6" cy="-3" r="2.5" fill="#12140d" />
          </g>
          <text x="3" y={l.ukuran * C - 4} className="fill-zinc-500 text-[9px]">0,0</text>
        </svg>
        <p aria-live="polite" className={`mt-2 min-h-12 text-center text-sm ${warnaHasil}`}>{hasil}</p>
      </div>
      <div role="group" aria-label="Perintah" className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => tambah("maju")} className={simGhost}>Maju</button>
        <button type="button" onClick={() => tambah("kiri")} className={simGhost}>Belok kiri</button>
        <button type="button" onClick={() => tambah("kanan")} className={simGhost}>Belok kanan</button>
        {l.ulang && <button type="button" onClick={() => tambah({ ulang: n, isi: "maju" })} className={simGhost}>Ulangi {n}x maju</button>}
      </div>
      {l.ulang && <div className="mt-2"><Chips label="Ulangi berapa kali" value={n} options={[2, 3, 4] as const} onChange={setN} /></div>}
      <p className="mt-3 text-sm font-bold">Programmu ({prog.length}/{l.maksItem} baris)</p>
      {prog.length === 0 ? <p className="text-xs text-zinc-400">Belum ada perintah. Tekan tombol di atas.</p> : (
        <ol className="mt-1 flex flex-wrap gap-1">
          {prog.map((p, i) => (
            <li key={i}><button type="button" aria-label={`Hapus baris ${i + 1}: ${namaItem(p)}`} onClick={() => ubah(prog.filter((_, j) => j !== i))} className="min-h-11 rounded-full border-2 border-noir bg-zinc-800 px-3 text-xs font-bold">{i + 1}. {namaItem(p)} <span aria-hidden>×</span></button></li>
          ))}
        </ol>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={prog.length === 0 || jalan} onClick={mulai} className={simButton}>Jalankan</button>
        <button type="button" disabled={prog.length === 0} onClick={() => ubah(prog.slice(0, -1))} className={simGhost}>Hapus terakhir</button>
        <button type="button" disabled={prog.length === 0} onClick={() => ubah([])} className={simGhost}>Kosongkan</button>
      </div>
      <pre className={snippet} aria-label="Program dalam teks">{BARIS(prog) || "// program kosong"}</pre>
    </Frame>
  );
}
