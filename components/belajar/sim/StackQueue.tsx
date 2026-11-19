import { useState } from "react";
import { CAP, type Result, type SQ, add, remove } from "../../../lib/sim/stack-queue";
import Frame, { G, INK, simButton, simGhost } from "./Frame";

const AMBER = "#f2c879";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function Lane({ name, rule, items, lastOut, enter, exit, color }: { name: string; rule: string; items: string[]; lastOut?: string; enter: string; exit: string; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <p className="text-sm font-extrabold" style={{ color }}>{name} <span className="font-normal text-zinc-400">{rule}</span></p>
        <p className="text-xs text-zinc-500">{items.length}/{CAP}</p>
      </div>
      <div className="flex gap-1.5" role="img" aria-label={`${name}: ${items.join(", ") || "kosong"}`}>
        {Array.from({ length: CAP }, (_, i) => (
          <div key={i} className="grid h-11 min-w-0 flex-1 place-items-center rounded-lg border-2 border-dashed border-zinc-700 text-base font-extrabold">
            {items[i] !== undefined && (
              <span key={`${items[i]}${i}`} className="sim-pop grid size-full place-items-center rounded-md" style={{ background: color, color: INK }}>{items[i]}</span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-zinc-400" aria-hidden>
        <span>{exit}</span>
        <span className="text-right">{enter}</span>
      </div>
      <p className="min-h-5 text-xs" style={{ color: AMBER }}>{lastOut ? `Keluar terakhir: ${lastOut}` : ""}</p>
    </div>
  );
}

export default function StackQueue({ title }: { title: string }) {
  const [s, setS] = useState<SQ>({ stack: [], queue: [] });
  const [counter, setCounter] = useState(0);
  const [raw, setRaw] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [out, setOut] = useState<{ stack: string; queue: string } | null>(null);
  const next = LETTERS[counter % 26];

  const doAdd = () => {
    const v = raw.trim().slice(0, 3) || next;
    const r = add(s, v);
    setRes(r);
    if (r.ok) { setS(r.state); setCounter(counter + 1); setRaw(""); }
  };
  const doRemove = () => {
    const r = remove(s);
    setRes(r);
    if (r.ok) { setS(r.state); setOut(r.out ?? null); }
  };
  const reset = () => { setS({ stack: [], queue: [] }); setRes(null); setOut(null); setCounter(0); setRaw(""); };

  return (
    <Frame title={title} hint="Item yang sama masuk ke stack dan queue. Keluarkan beberapa kali dan lihat siapa yang keluar lebih dulu di masing-masing.">
      <div className="sim-stage space-y-3 p-3">
        <Lane name="Stack" rule="LIFO: terakhir masuk, pertama keluar" items={s.stack} lastOut={out?.stack} color={G} enter="push dan pop di puncak (kanan)" exit="dasar" />
        <Lane name="Queue" rule="FIFO: pertama masuk, pertama keluar" items={s.queue} lastOut={out?.queue} color="#8fc5ea" enter="enqueue di belakang (kanan)" exit="dequeue dari depan (kiri)" />
      </div>

      <p aria-live="polite" className={`mt-3 min-h-12 text-sm ${res && !res.ok ? "text-[#f2c879]" : "text-zinc-300"}`}>{res ? res.text : "Tambahkan beberapa item, lalu keluarkan."}</p>

      <div className="mt-2 flex flex-wrap gap-2">
        <input value={raw} onChange={(e) => setRaw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doAdd()} maxLength={3} aria-label="Nilai item" placeholder={next}
          className="min-h-11 w-20 rounded-full border-2 border-noir bg-zinc-800 px-3 text-center text-sm font-bold" />
        <button type="button" onClick={doAdd} className={simButton}>Tambah</button>
        <button type="button" onClick={doRemove} className={simGhost}>Keluarkan</button>
        <button type="button" onClick={reset} disabled={!s.stack.length && !res} className={simGhost}>Reset</button>
      </div>
    </Frame>
  );
}
