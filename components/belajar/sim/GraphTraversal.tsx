import { useMemo, useState } from "react";
import { ADJ, EDGES, NODES, type Mode, traverse } from "../../../lib/sim/graph";
import Frame, { G, INK, simChip } from "./Frame";
import { PlayerControls, usePlayer } from "./AlgoPlayer";

const AMBER = "#f2c879";
const pos = Object.fromEntries(NODES.map((n) => [n.id, n]));

export default function GraphTraversal({ title }: { title: string }) {
  const [mode, setMode] = useState<Mode>("bfs");
  const [start, setStart] = useState("A");
  const steps = useMemo(() => traverse(ADJ, start, mode), [start, mode]);
  const p = usePlayer(steps.length);
  const s = steps[p.i];
  const inBox = new Set(s.box);
  const order = (id: string) => s.visited.indexOf(id) + 1;
  const walked = (a: string, b: string) => s.edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const pick = (fn: () => void) => { fn(); p.reset(); };
  const bfs = mode === "bfs";

  return (
    <Frame title={title} hint="Pilih simpul awal dan metode, lalu putar atau maju per langkah. Perhatikan isi queue atau stack dan urutan kunjungannya.">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Metode penelusuran" className="flex rounded-full bg-zinc-800 p-0.5">
          <button type="button" aria-pressed={bfs} onClick={() => pick(() => setMode("bfs"))} className={simChip}>BFS (queue)</button>
          <button type="button" aria-pressed={!bfs} onClick={() => pick(() => setMode("dfs"))} className={simChip}>DFS (stack)</button>
        </div>
        <div role="group" aria-label="Simpul awal" className="flex flex-wrap rounded-2xl bg-zinc-800 p-0.5">
          {NODES.map((n) => (
            <button key={n.id} type="button" aria-label={`Mulai dari ${n.id}`} aria-pressed={start === n.id} onClick={() => pick(() => setStart(n.id))} className={`${simChip} min-w-9 px-2`}>{n.id}</button>
          ))}
        </div>
      </div>

      <div className="sim-stage mt-3 p-3">
        <svg viewBox="0 0 300 255" className="mx-auto block w-full max-w-sm" role="img" aria-label={`Graf 8 simpul, penelusuran ${bfs ? "BFS" : "DFS"} dari ${start}, ${s.visited.length} simpul dikunjungi`}>
          {EDGES.map(([a, b]) => (
            <line key={a + b} x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y}
              stroke={walked(a, b) ? AMBER : "#3f3f46"} strokeWidth={walked(a, b) ? 3 : 2} className={walked(a, b) ? "sim-blink" : undefined} />
          ))}
          {NODES.map((n) => {
            const cur = s.current === n.id;
            const seen = order(n.id) > 0;
            const front = inBox.has(n.id) && !seen;
            return (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r={cur ? 20 : 17} fill={seen ? G : front ? INK : "#27272a"} stroke={cur ? "#f4f7ea" : front ? AMBER : seen ? "#6b7d3c" : "#52525b"}
                  strokeWidth={cur ? 3 : 2} strokeDasharray={front ? "4 3" : undefined} style={cur ? { filter: `drop-shadow(0 0 6px ${G})` } : undefined} />
                <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize="15" fontWeight="800" fill={seen ? INK : front ? AMBER : "#a1a1aa"}>{n.id}</text>
                {seen && (
                  <g>
                    <circle cx={n.x + 15} cy={n.y - 15} r="9" fill={INK} stroke={G} strokeWidth="1.5" />
                    <text x={n.x + 15} y={n.y - 11.5} textAnchor="middle" fontSize="11" fontWeight="800" fill={G}>{order(n.id)}</text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
        <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-zinc-400" aria-hidden>
          <span><i className="mr-1 inline-block size-2.5 rounded-full bg-zinc-700 align-middle" />belum</span>
          <span><i className="mr-1 inline-block size-2.5 rounded-full border border-dashed align-middle" style={{ borderColor: AMBER }} />antre ({bfs ? "queue" : "stack"})</span>
          <span><i className="mr-1 inline-block size-2.5 rounded-full align-middle" style={{ background: G }} />sudah dikunjungi</span>
        </div>

        <div className="mt-3">
          <p className="mb-1 text-xs font-bold text-zinc-400">{bfs ? "Queue: depan di kiri, belakang di kanan" : "Stack: dasar di kiri, puncak di kanan"}</p>
          <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-dashed border-zinc-700 p-1.5" aria-label={`Isi ${bfs ? "queue" : "stack"}: ${s.box.join(", ") || "kosong"}`}>
            {s.box.length === 0 && <span className="px-2 text-sm text-zinc-500">kosong</span>}
            {s.box.map((id, k) => (
              <span key={`${id}${k}${s.visited.length}`} className="sim-pop grid size-8 place-items-center rounded-lg border-2 text-sm font-extrabold" style={{ borderColor: AMBER, color: AMBER, opacity: s.visited.includes(id) ? 0.4 : 1 }}>{id}</span>
            ))}
          </div>
        </div>
        <div className="mt-2">
          <p className="mb-1 text-xs font-bold text-zinc-400">Urutan kunjungan</p>
          <div className="flex min-h-8 flex-wrap items-center gap-1 text-sm font-extrabold" style={{ color: G }}>
            {s.visited.length === 0 ? <span className="font-normal text-zinc-500">belum ada</span> : s.visited.map((id, k) => <span key={id}>{id}{k < s.visited.length - 1 && <span className="px-1 text-zinc-600">›</span>}</span>)}
          </div>
        </div>
      </div>

      <p aria-live="polite" className="mt-3 min-h-12 text-sm text-zinc-300">{s.text}</p>
      <PlayerControls p={p} />
    </Frame>
  );
}
