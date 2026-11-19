import { useEffect, useRef, useState } from "react";
import { canCommit, canMerge, canRebase, commit, type Graph, initGraph, live, merge, newBranch, nextName, rebase, switchTo, tip } from "../../../lib/sim/git-graph";
import Frame, { G, INK, reducedMotion, simButton, simChip, simGhost } from "./Frame";

const LANE = [G, "#f2c879", "#8fc5ea", "#e8a0c8"];
const DX = 52, DY = 64, X0 = 30, Y0 = 74;

export default function GitGraph({ title }: { title: string }) {
  const [g, setG] = useState<Graph>(initGraph);
  const box = useRef<HTMLDivElement>(null);
  const run = (f: (x: Graph) => Graph) => setG(f);

  useEffect(() => {
    box.current?.scrollTo({ left: box.current.scrollWidth, behavior: reducedMotion() ? "auto" : "smooth" });
  }, [g.commits.length]);

  const alive = live(g);
  const idx = new Map(g.commits.map((c, i) => [c.id, i]));
  const pos = (id: string) => ({ x: X0 + (idx.get(id) ?? 0) * DX, y: Y0 + (g.commits.find((c) => c.id === id)?.lane ?? 0) * DY });
  const lanes = Math.max(...g.commits.map((c) => c.lane)) + 1;
  const W = X0 * 2 + (g.commits.length - 1) * DX, H = Y0 + (lanes - 1) * DY + 40;
  const names = Object.keys(g.branches);
  const stack: Record<string, number> = {};
  const motion = reducedMotion() ? undefined : "sim-move";

  return (
    <Frame title={title} hint="Buat commit dan branch, lalu gabungkan dengan merge atau rebase. Perhatikan HEAD, label branch, dan hash commit.">
      <div className="sim-stage p-2 sm:p-3">
        <div ref={box} className="overflow-x-auto">
          <svg width={Math.max(W, 280)} height={H} role="img" aria-label={`Graf commit: ${g.commits.length} commit, ${names.length} branch, HEAD di ${g.head}`} className="block">
            {g.commits.map((c) => c.parents.map((p, k) => {
              const a = pos(p), b = pos(c.id);
              const dead = !alive.has(c.id);
              return <path key={`${c.id}-${k}`} d={`M${a.x} ${a.y} C${a.x + 26} ${a.y},${b.x - 26} ${b.y},${b.x} ${b.y}`} fill="none" stroke={LANE[c.lane % 4]} strokeWidth={2.5} strokeDasharray={k ? "5 4" : undefined} className={motion} style={{ opacity: dead ? 0.18 : 0.9 }} />;
            }))}
            {g.commits.map((c) => {
              const { x, y } = pos(c.id);
              const dead = !alive.has(c.id);
              return (
                <g key={c.id} className={motion} style={{ transform: `translate(${x}px,${y}px)`, opacity: dead ? 0.25 : 1 }}>
                  <g className="sim-pop" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
                    <circle r={11} fill={c.parents.length > 1 ? INK : LANE[c.lane % 4]} stroke={LANE[c.lane % 4]} strokeWidth={3} />
                    {c.parents.length > 1 && <circle r={4} fill={LANE[c.lane % 4]} />}
                    <text y={27} textAnchor="middle" fontSize={9} fontFamily="ui-monospace,monospace" fill={dead ? "#71717a" : "#a1a1aa"} textDecoration={dead ? "line-through" : undefined}>{c.id}</text>
                  </g>
                </g>
              );
            })}
            {names.map((b) => {
              const t = tip(g, b);
              const { x, y } = pos(t);
              const k = stack[t] ?? 0;
              stack[t] = k + 1;
              const isHead = b === g.head;
              const text = isHead ? `HEAD → ${b}` : b;
              const w = text.length * 6.4 + 14;
              const col = LANE[(g.lanes[b] ?? 0) % 4] as string;
              return (
                <g key={b} className={motion} style={{ transform: `translate(${x - 11}px,${y - 38 - k * 20}px)` }}>
                  <rect width={w} height={17} rx={6} fill={isHead ? col : INK} stroke={col} strokeWidth={1.5} />
                  <text x={7} y={12.5} fontSize={10.5} fontWeight={700} fontFamily="ui-monospace,monospace" fill={isHead ? INK : col}>{text}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="mt-2 rounded-xl bg-black/50 px-3 py-2 font-mono text-xs" aria-live="polite">
          <p className="break-all"><span className="text-[#b5d36f]">$</span> {g.cmd}</p>
          <p className="mt-1 font-sans text-zinc-400">{g.note}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={!canCommit(g)} onClick={() => run(commit)} className={simButton}>git commit</button>
        <button type="button" disabled={!nextName(g) || g.commits.length >= 16} onClick={() => run(newBranch)} className={simGhost}>Branch baru</button>
        <button type="button" disabled={!canRebase(g)} onClick={() => run(rebase)} className={simGhost} aria-label="Rebase branch aktif ke atas main">rebase main</button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1" role="group" aria-label="Pindah branch">
        <span className="px-2 text-sm text-zinc-400">switch:</span>
        {names.map((b) => <button key={b} type="button" aria-pressed={b === g.head} onClick={() => run((x) => switchTo(x, b))} className={simChip}>{b}</button>)}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span className="px-2 text-sm text-zinc-400">merge ke {g.head}:</span>
        {names.filter((b) => b !== g.head).map((b) => <button key={b} type="button" disabled={!canMerge(g, b)} onClick={() => run((x) => merge(x, b))} className={simGhost}>{b}</button>)}
        {names.length < 2 && <span className="text-sm text-zinc-500">buat branch dulu</span>}
      </div>
      <p className="mt-2 text-xs text-zinc-500">{g.commits.length >= 16 ? "Graf penuh. " : ""}Titik berlubang = merge commit; garis putus = induk kedua.</p>
      <button type="button" onClick={() => setG(initGraph())} className="min-h-11 px-2 text-sm text-zinc-400 underline underline-offset-2">Reset</button>
    </Frame>
  );
}
