import { useState } from "react";
import { awal, catatan, MAKS_COMMIT, NAMA, NAMA_PR, terapkan, tersedia, type Alur, type Aksi } from "@/lib/sim/github-flow";
import Frame, { simButton, simGhost } from "./Frame";
import Chips from "./Chips";

const ALUR = { "Tim (branch)": "tim", "Kontributor luar (fork)": "fork" } as const;
const X = (c: number) => 50 + 76 * c;
const LABEL = "text-[13px] fill-[#bfc0b5] font-mono";

export default function GithubFlow({ title }: { title: string }) {
  const [k, setK] = useState(awal("tim"));
  const fork = k.alur === "fork";
  const yAsli = 34, yFork = 100, yBr = fork ? 166 : 100;
  const yAsal = fork ? yFork : yAsli; // lajur tempat branch bercabang
  const H = fork ? 205 : 140;
  const merged = k.pr === "merged";
  const warnaPr = k.pr === "merged" ? "#b5d36f" : k.pr === "perubahan" ? "#f08a7a" : k.pr === "disetujui" ? "#b5d36f" : k.pr === "terbuka" ? "#7fb3d9" : "#bfc0b5";
  const nodes = Array.from({ length: k.commit }, (_, i) => i + 1);
  const aksi = tersedia(k);
  const ringkas = `Main repo asli ${k.mainCommit} commit. Branch fitur ${k.branch ? `${k.commit} commit, ${k.belumPush} belum di-push` : "tidak ada"}. Status PR: ${NAMA_PR[k.pr]}.`;
  const ganti = (v: string) => setK(awal(ALUR[v as keyof typeof ALUR] as Alur));
  const kurva = (x1: number, y1: number, x2: number, y2: number) => `M${x1} ${y1}C${x1 + 30} ${y1} ${x2 - 30} ${y2} ${x2} ${y2}`;

  return (
    <Frame title={title} hint="Klik langkah berikutnya satu per satu. Perhatikan: main baru berubah saat merge, bukan saat commit atau push.">
      <Chips label="Peranmu" value={Object.keys(ALUR).find((n) => ALUR[n as keyof typeof ALUR] === k.alur)!} options={Object.keys(ALUR)} onChange={ganti} />
      <div className="sim-stage mt-3 p-3">
        <svg viewBox={`0 0 480 ${H}`} role="img" aria-label={ringkas} className="mx-auto block w-full max-w-xl">
          <text x="8" y={yAsli - 14} className={LABEL}>{fork ? "main (repo asli)" : "main"}</text>
          <path d={`M${X(0)} ${yAsli}H${X(5)}`} stroke="#3a3d30" strokeWidth="3" strokeLinecap="round" />
          <path d={`M${X(0)} ${yAsli}H${merged ? X(5) : X(0)}`} stroke="#b5d36f" strokeWidth="3" strokeLinecap="round" />
          <circle cx={X(0)} cy={yAsli} r="8" fill="#d6ea9c" stroke="#12140d" strokeWidth="2" />
          {merged && <circle cx={X(5)} cy={yAsli} r="10" fill="#b5d36f" stroke="#12140d" strokeWidth="2" />}
          {merged && <text x={X(5)} y={yAsli + 24} textAnchor="middle" className={LABEL}>merge</text>}
          {fork && (
            <g>
              <text x="8" y={yFork - 14} className={LABEL}>main (fork-mu)</text>
              {k.fork ? (
                <>
                  <path d={`M${X(0)} ${yAsli}V${yFork}`} stroke="#7fb3d9" strokeWidth="2" strokeDasharray="4 3" fill="none" />
                  <path d={`M${X(0)} ${yFork}H${X(5)}`} stroke="#3a3d30" strokeWidth="3" strokeLinecap="round" />
                  <circle cx={X(0)} cy={yFork} r="8" fill="#d6ea9c" stroke="#12140d" strokeWidth="2" />
                </>
              ) : <text x={X(0)} y={yFork + 4} className="fill-zinc-500 text-[11px]">belum ada fork</text>}
            </g>
          )}
          {(k.branch || merged) && k.commit > 0 && (
            <g opacity={k.branch ? 1 : 0.4}>
              <text x="8" y={yBr - 14} className={LABEL}>{k.branch ? "branch fitur" : "branch fitur (dihapus)"}</text>
              <path d={kurva(X(0), yAsal, X(1), yBr)} stroke="#7fb3d9" strokeWidth="3" fill="none" />
              <path d={`M${X(1)} ${yBr}H${X(k.commit)}`} stroke="#7fb3d9" strokeWidth="3" />
              {nodes.map((c) => {
                const belum = c > k.commit - k.belumPush;
                return <circle key={c} cx={X(c)} cy={yBr} r="8" fill={belum ? "#12140d" : "#7fb3d9"} stroke={belum ? "#7fb3d9" : "#12140d"} strokeWidth="2" strokeDasharray={belum ? "3 2" : undefined} />;
              })}
              {merged && <path d={kurva(X(k.commit), yBr, X(5), yAsli)} stroke="#b5d36f" strokeWidth="3" fill="none" />}
            </g>
          )}
          {k.branch && k.commit === 0 && (
            <g>
              <text x="8" y={yBr - 14} className={LABEL}>branch fitur</text>
              <path d={kurva(X(0), yAsal, X(1), yBr)} stroke="#7fb3d9" strokeWidth="3" fill="none" />
              <circle cx={X(1)} cy={yBr} r="5" fill="#7fb3d9" />
            </g>
          )}
          {(k.pr === "terbuka" || k.pr === "perubahan" || k.pr === "disetujui") && (
            <g>
              <path d={kurva(X(k.commit) + 8, yBr, X(5) - 8, yAsli + 8)} stroke={warnaPr} strokeWidth="2" strokeDasharray="5 4" fill="none" />
              <text x={X(4)} y={(yBr + yAsli) / 2} textAnchor="middle" fill={warnaPr} className="text-[11px] font-bold">PR</text>
            </g>
          )}
          {k.belumPush > 0 && <text x={X(k.commit)} y={yBr + 26} textAnchor="middle" className={LABEL}>belum di-push</text>}
        </svg>
        <dl className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
          <div><dt className="text-zinc-400">Status PR</dt><dd className="font-bold" style={{ color: warnaPr }}>{NAMA_PR[k.pr]}</dd></div>
          <div><dt className="text-zinc-400">Commit di main</dt><dd className="font-bold text-zinc-200">{k.mainCommit}</dd></div>
          <div><dt className="text-zinc-400">Commit di branch</dt><dd className="font-bold text-zinc-200">{k.branch ? `${k.commit} (${k.belumPush} belum push)` : "-"}</dd></div>
        </dl>
        <p aria-live="polite" className="mt-2 min-h-16 text-center text-sm text-zinc-300">{catatan(k)}</p>
      </div>
      <p className="mt-3 text-sm font-bold">Langkah berikutnya</p>
      <div role="group" aria-label="Langkah berikutnya" className="mt-1 flex flex-wrap gap-2">
        {aksi.map((a: Aksi) => <button key={a} type="button" onClick={() => setK((o) => terapkan(o, a))} className={simButton}>{NAMA[a]}</button>)}
        {aksi.length === 0 && <p className="self-center text-sm text-zinc-300">Alur selesai.</p>}
        <button type="button" onClick={() => setK(awal(k.alur))} className={simGhost}>Ulangi dari awal</button>
      </div>
      {k.commit >= MAKS_COMMIT && k.pr !== "merged" && k.pr !== "disetujui" && <p className="mt-1 text-xs text-zinc-400">Batas {MAKS_COMMIT} commit di simulasi ini.</p>}
    </Frame>
  );
}
