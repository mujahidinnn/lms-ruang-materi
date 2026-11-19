import { useState, type ReactNode } from "react";
import Frame, { simButton, simChip, simGhost } from "./Frame";
import { rerender, type Memo, type NodeId } from "../../../lib/sim/react-render";

type Info = { count: number; flash: boolean; skipped: boolean };
const ids: NodeId[] = ["App", "Header", "Counter", "List", "Item1", "Item2"];
const init = () => Object.fromEntries(ids.map((i) => [i, { count: 1, flash: false, skipped: false }])) as Record<NodeId, Info>;

export default function ReactRender({ title }: { title: string }) {
  const [info, setInfo] = useState(init);
  const [tick, setTick] = useState(0);
  const [memo, setMemo] = useState<Memo>({});
  const [note, setNote] = useState("Klik salah satu tombol untuk mengubah state, lalu lihat komponen mana yang ikut render.");
  const [state, setState] = useState({ app: 0, local: 0 });

  const fire = (owner: NodeId) => {
    const { rendered, skipped } = rerender(owner, memo);
    setInfo((p) => Object.fromEntries(ids.map((i) => [i, { count: p[i].count + (rendered.has(i) ? 1 : 0), flash: rendered.has(i), skipped: skipped.has(i) }])) as Record<NodeId, Info>);
    setTick((t) => t + 1);
    setState((s) => (owner === "App" ? { ...s, app: s.app + 1 } : { ...s, local: s.local + 1 }));
    setNote(`${owner} mengubah state. Render: ${[...rendered].join(", ")}.${skipped.size ? ` Dilewati React.memo: ${[...skipped].join(", ")}.` : ""}`);
  };
  const reset = () => { setInfo(init()); setTick(0); setState({ app: 0, local: 0 }); setNote("Dikembalikan ke render pertama."); };

  const box = (id: NodeId, label?: string, children?: ReactNode) => {
    const i = info[id];
    return (
      <div key={`${id}${tick}`} className={`rounded-xl border-2 p-2 ${i.flash ? "sim-pop" : ""}`} style={{ borderColor: i.flash ? "#b5d36f" : i.skipped ? "#c9a8ff" : "#3c3e36", background: i.flash ? "rgb(181 211 111 / 0.18)" : "transparent" }}>
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="font-mono text-xs font-bold sm:text-sm">{"<"}{id}{" />"}{memo[id] && <span className="ml-1 text-[#c9a8ff]">memo</span>}</span>
          <span className="rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-bold" aria-label={`${id} sudah render ${i.count} kali`}>render {i.count}x</span>
        </div>
        {label && <p className="mt-1 text-[11px] text-zinc-400">{label}</p>}
        {tick > 0 && <p className="mt-1 text-[11px] font-bold" style={{ color: i.flash ? "#b5d36f" : i.skipped ? "#c9a8ff" : "#8b8d81" }}>{i.flash ? "render ulang" : i.skipped ? "dilewati (props sama)" : "tidak disentuh"}</p>}
        {children && <div className="mt-2 grid gap-2">{children}</div>}
      </div>
    );
  };

  return (
    <Frame title={title} hint="State ada di dua tempat. Ubah satu, lalu amati siapa yang render ulang dan bagaimana React.memo menahannya.">
      <div className="sim-stage p-3 sm:p-4">
        {box("App", `state: count = ${state.app}`, <>
          {box("Header", "props: tidak ada")}
          {box("Counter", `props: count = ${state.app} | state lokal: suka = ${state.local}`)}
          {box("List", "props: tidak ada", <div className="grid grid-cols-2 gap-2">{box("Item1")}{box("Item2")}</div>)}
        </>)}
        <p role="status" className="mt-3 text-sm font-bold break-words text-[#b5d36f]">{note}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className={simButton} onClick={() => fire("App")}>Tambah count di App</button>
        <button type="button" className={simButton} onClick={() => fire("Counter")}>Tambah suka di Counter</button>
        <button type="button" className={simGhost} onClick={reset}>Ulangi</button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1 rounded-3xl bg-zinc-800 p-1" role="group" aria-label="React.memo per komponen">
        <span className="px-3 text-sm text-zinc-400">React.memo:</span>
        {(["Header", "Counter", "List"] as const).map((id) => (
          <button key={id} type="button" aria-pressed={!!memo[id]} onClick={() => setMemo((m) => ({ ...m, [id]: !m[id] }))} className={simChip}>{id}</button>
        ))}
      </div>
    </Frame>
  );
}
