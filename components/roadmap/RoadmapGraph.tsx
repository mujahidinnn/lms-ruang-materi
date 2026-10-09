"use client";

import type { NodeState, PlacedNode, RoadmapEdge } from "@/lib/roadmap";
import StateIcon from "./StateIcon";

const W = 148;
const H = 48;
const GAP_X = 44;
const GAP_Y = 20;

const x = (n: PlacedNode) => n.column * (W + GAP_X);
const y = (n: PlacedNode) => n.row * (H + GAP_Y);

// Pointer view only: aria-hidden and out of the tab order. The ordered list
// next to it is the accessible roadmap.
export default function RoadmapGraph({
  nodes,
  edges,
  states,
  selected,
  onSelect,
}: {
  nodes: PlacedNode[];
  edges: RoadmapEdge[];
  states: Record<string, NodeState>;
  selected: string | null;
  onSelect?: (id: string) => void;
}) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const width = Math.max(...nodes.map((n) => x(n) + W));
  const height = Math.max(...nodes.map((n) => y(n) + H));

  return (
    <div aria-hidden className="scrollbar-thin overflow-x-auto pb-4">
      <div className="relative" style={{ width, height }}>
        <svg width={width} height={height} className="absolute inset-0" fill="none">
          {edges.map(({ from, to }) => {
            const a = byId.get(from);
            const b = byId.get(to);
            if (!a || !b) return null;
            const x1 = x(a) + W;
            const y1 = y(a) + H / 2;
            const x2 = x(b);
            const y2 = y(b) + H / 2;
            const mid = (x1 + x2) / 2;
            const lit = selected === from || selected === to;
            return (
              <path
                key={`${from}-${to}`}
                d={`M${x1} ${y1}C${mid} ${y1} ${mid} ${y2} ${x2} ${y2}`}
                strokeWidth="2"
                strokeLinecap="round"
                className={lit ? "stroke-accent" : "stroke-zinc-700"}
              />
            );
          })}
        </svg>
        {nodes.map((n) => {
          const state = states[n.id] ?? "belum";
          return (
            <button
              key={n.id}
              type="button"
              tabIndex={-1}
              onClick={() => onSelect?.(n.id)}
              style={{ left: x(n), top: y(n), width: W, height: H }}
              className={`absolute flex items-center gap-2 rounded-xl border px-3 text-left text-sm transition-colors ${
                selected === n.id
                  ? "border-accent bg-accent/10 text-zinc-50"
                  : state === "selesai"
                    ? "border-accent/40 bg-zinc-900 text-zinc-50 hover:border-accent"
                    : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600 hover:text-zinc-50"
              } ${n.optional ? "border-dashed" : ""}`}
            >
              <StateIcon state={state} />
              <span className="line-clamp-2 leading-tight font-medium">{n.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
