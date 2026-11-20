import { useState } from "react";
import { ALAMAT_DATA, awal, langkah, teksInstr, ubahOperand, type Cpu } from "@/lib/sim/cpu-fetch-execute";
import Frame, { simButton, simGhost } from "./Frame";

const FASE = ["fetch", "decode", "execute"] as const;
const WARNA = "#b5d36f";

export default function CpuFetchExecute({ title }: { title: string }) {
  const [s, setS] = useState<Cpu>(awal);
  const selFase = s.selesai ? null : s.fase;
  const sorot = (a: number) => (s.baca === a ? "baca" : s.tulis === a ? "tulis" : s.pc === a && !s.selesai && s.fase === "fetch" ? "pc" : "");
  const reg = (nama: string, nilai: string, aktif: boolean) => (
    <div className={`rounded-lg border-2 px-3 py-2 text-center ${aktif ? "border-matcha-300 bg-[#2b3517]" : "border-zinc-600 bg-[#14160f]"}`}>
      <div className="font-mono text-[11px] text-zinc-400">{nama}</div>
      <div className="min-h-6 font-mono text-sm font-bold text-zinc-100">{nilai}</div>
    </div>
  );

  return (
    <Frame title={title} hint="Tekan Langkah berulang kali. Satu instruksi butuh tiga langkah: fetch, decode, execute. Ubah operand lalu reset untuk melihat hasil lain.">
      <div className="sim-stage p-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_1.1fr]">
          <div role="group" aria-label="CPU" className="rounded-xl border-2 border-zinc-600 p-3">
            <p className="mb-2 text-xs font-bold text-zinc-300">CPU</p>
            <div className="grid grid-cols-3 gap-2">
              {reg("PC", String(s.pc), s.fase === "fetch" && !s.selesai)}
              {reg("IR", s.ir ? teksInstr(s.ir) : "-", s.fase === "decode")}
              {reg("ACC", String(s.acc), s.fase === "execute" && s.ir?.op !== "HALT")}
            </div>
            <ol aria-label="Fase siklus" className="mt-3 flex gap-1">
              {FASE.map((f) => (
                <li key={f} aria-current={selFase === f ? "step" : undefined} className={`flex-1 rounded-full border-2 py-1 text-center font-mono text-xs font-bold ${selFase === f ? "border-matcha-300 bg-matcha-300 text-noir" : "border-zinc-600 text-zinc-400"}`}>{f}</li>
              ))}
            </ol>
            <p className="mt-2 text-center font-mono text-[11px] text-zinc-400">{s.selesai ? "selesai" : `berikutnya: ${s.fase}`}</p>
          </div>
          <div role="group" aria-label="Memori" className="rounded-xl border-2 border-zinc-600 p-3">
            <p className="mb-2 text-xs font-bold text-zinc-300">Memori</p>
            <ul className="grid gap-1">
              {s.mem.map((x, a) => {
                const m = sorot(a);
                const tipe = a < 5 ? "kode" : a === 7 ? "hasil" : "data";
                return (
                  <li key={a} className={`flex items-center gap-2 rounded-md border px-2 py-1 font-mono text-xs ${m === "baca" ? "border-matcha-300 bg-[#2b3517]" : m === "tulis" ? "border-amber-300 bg-[#3a2f10]" : m === "pc" ? "border-zinc-300" : "border-zinc-700"}`}>
                    <span className="w-4 text-zinc-400">{a}</span>
                    <span className="w-9 text-[10px] text-zinc-500">{tipe}</span>
                    <span className="flex-1 font-bold text-zinc-100">{typeof x === "number" ? x : teksInstr(x)}</span>
                    <span className="w-24 text-right text-[10px]" style={{ color: m === "tulis" ? "#fcd34d" : WARNA }}>{m === "baca" ? "dibaca" : m === "tulis" ? "ditulis" : m === "pc" ? "<- PC" : ""}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <p aria-live="polite" className="mt-3 min-h-12 text-sm text-zinc-300">{s.pesan}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={s.selesai} onClick={() => setS(langkah(s))} className={simButton}>Langkah</button>
        <button type="button" onClick={() => setS(awal(s.mem[5] as number, s.mem[6] as number))} className={simGhost}>Reset</button>
      </div>
      <div role="group" aria-label="Ubah operand" className="mt-2 flex flex-wrap items-center gap-2">
        {ALAMAT_DATA.slice(0, 2).map((a) => (
          <div key={a} className="flex items-center gap-1">
            <span className="text-sm font-bold">alamat {a}</span>
            <button type="button" aria-label={`Kurangi operand alamat ${a}`} onClick={() => setS(ubahOperand(s, a as 5 | 6, (s.mem[a] as number) - 1))} className={`${simGhost} w-11 px-0`}>-</button>
            <span className="w-8 text-center font-mono text-sm">{s.mem[a] as number}</span>
            <button type="button" aria-label={`Tambah operand alamat ${a}`} onClick={() => setS(ubahOperand(s, a as 5 | 6, (s.mem[a] as number) + 1))} className={`${simGhost} w-11 px-0`}>+</button>
          </div>
        ))}
      </div>
    </Frame>
  );
}
