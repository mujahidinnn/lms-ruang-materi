import { type FormEvent, useState } from "react";
import { CAP, type Tree, has, inorder, insert, layout, size, trace } from "../../../lib/sim/bst";
import Frame, { G, INK, simButton, simGhost } from "./Frame";
import { PlayerControls, usePlayer } from "./AlgoPlayer";

const AMBER = "#f2c879";
type Op = { kind: "insert" | "search"; value: number; steps: ReturnType<typeof trace> };

export default function Bst({ title }: { title: string }) {
  const [base, setBase] = useState<Tree>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [raw, setRaw] = useState("");
  const [msg, setMsg] = useState("Masukkan angka 0 sampai 99, lalu sisipkan atau cari.");
  const p = usePlayer(op ? op.steps.length : 1);

  // The inserted node appears on the last step; the next action commits it into `base`.
  const done = !!op && p.i === p.last;
  const shown = op?.kind === "insert" && done ? insert(base, op.value) : base;
  const step = op ? op.steps[p.i] : null;
  const found = !!op && done && op.kind === "search" && has(base, op.value);
  const { nodes, H } = layout(shown);
  const count = size(shown);
  const path = new Set(op ? op.steps.slice(0, p.i + 1).map((s) => s.node) : []);

  const start = (kind: Op["kind"], e?: FormEvent) => {
    e?.preventDefault();
    const v = Number(raw);
    if (raw.trim() === "" || !Number.isInteger(v) || v < 0 || v > 99) return setMsg("Isi angka bulat 0 sampai 99.");
    if (kind === "insert" && has(shown, v)) return setMsg(`${v} sudah ada di tree. BST tidak menyimpan duplikat.`);
    if (kind === "insert" && count >= CAP) return setMsg(`Tree penuh (${CAP} simpul). Kosongkan dulu agar tampilan tetap terbaca.`);
    setBase(shown);
    setOp({ kind, value: v, steps: trace(shown, v, kind) });
    p.reset();
    setMsg("");
    setRaw("");
  };
  const fill = () => {
    let t = shown;
    const room = Math.min(7, CAP - size(t));
    if (room <= 0) return setMsg(`Tree penuh (${CAP} simpul).`);
    for (let k = 0; k < room; ) { const v = Math.floor(Math.random() * 100); if (!has(t, v)) { t = insert(t, v); k++; } }
    setBase(t); setOp(null); p.reset(); setMsg(`${room} angka acak ditambahkan.`);
  };
  const clear = () => { setBase(null); setOp(null); p.reset(); setMsg("Tree dikosongkan."); };

  const text = step ? step.text + (found ? " Jalurnya disorot." : "") : msg;
  const order = inorder(shown);

  return (
    <Frame title={title} hint="Sisipkan atau cari angka dan ikuti jalurnya dari akar: lebih kecil ke kiri, lebih besar ke kanan.">
      <form onSubmit={(e) => start("insert", e)} className="flex flex-wrap gap-2">
        <input value={raw} onChange={(e) => setRaw(e.target.value)} inputMode="numeric" maxLength={2} aria-label="Angka 0 sampai 99" placeholder="0-99"
          className="min-h-11 w-24 rounded-full border-2 border-noir bg-zinc-800 px-4 text-center text-sm font-bold" />
        <button type="submit" className={simButton}>Sisipkan</button>
        <button type="button" onClick={() => start("search")} className={simGhost}>Cari</button>
        <button type="button" onClick={fill} className={simGhost}>Isi acak</button>
        <button type="button" onClick={clear} disabled={count === 0} className={simGhost}>Kosongkan</button>
      </form>

      <div className="sim-stage mt-3 p-3">
        <div className="flex min-h-40 items-center">
          {count === 0 ? <p className="w-full text-center text-sm text-zinc-500">Tree kosong. Sisipkan angka pertama sebagai akar.</p> : (
            <svg viewBox={`0 0 360 ${H}`} className="mx-auto block w-full max-w-md" role="img" aria-label={`Binary search tree, ${count} simpul`}>
              {nodes.map((n) => n.px !== undefined && <line key={`e${n.v}`} x1={n.px} y1={n.py} x2={n.x} y2={n.y} stroke={path.has(n.v) && path.has(nodes.find((m) => m.x === n.px)?.v ?? -1) ? AMBER : "#3f3f46"} strokeWidth="2" />)}
              {nodes.map((n) => {
                const cur = step?.node === n.v;
                const onPath = path.has(n.v);
                const hit = found && cur;
                const fresh = op?.kind === "insert" && done && op.value === n.v;
                return (
                  <g key={n.v} className={fresh ? "sim-pop" : undefined} style={{ transformOrigin: `${n.x}px ${n.y}px` }}>
                    <circle cx={n.x} cy={n.y} r="14" fill={hit || fresh ? G : cur ? "#f4f7ea" : INK} stroke={onPath ? AMBER : "#52525b"} strokeWidth={cur ? 3 : 2} />
                    <text x={n.x} y={n.y + 4.5} textAnchor="middle" fontSize="12" fontWeight="800" fill={hit || fresh || cur ? INK : "#e4e4e7"}>{n.v}</text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
        <p className="mt-2 text-xs font-bold text-zinc-400">Inorder (terurut) · {count} dari {CAP} simpul</p>
        <p className="mt-1 min-h-7 text-sm font-extrabold" style={{ color: G }} aria-live="polite">{order.length ? order.join(", ") : <span className="font-normal text-zinc-500">kosong</span>}</p>
      </div>

      <p aria-live="polite" className="mt-3 min-h-12 text-sm text-zinc-300">{text}</p>
      {op && op.steps.length > 1 && <PlayerControls p={p} />}
    </Frame>
  );
}
