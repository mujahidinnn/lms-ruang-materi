import { useState } from "react";
import { add, ahead, type Areas, canAdd, canCommit, canPull, canPush, canTeammate, canUnstage, commit, edit, FILES, initAreas, modified, pull, push, staged, teammate, unstage } from "../../../lib/sim/git-areas";
import Frame, { simButton, simGhost } from "./Frame";

const C = { modified: "#f2c879", staged: "#b5d36f", committed: "#8fc5ea", theirs: "#e8a0c8", clean: "#52525b" };
const COLS = ["Working directory", "Staging area", "Local repo", "Remote"];

function Chip({ name, v, c, tag, selected, onClick }: { name: string; v: number; c: string; tag: string; selected?: boolean; onClick?: () => void }) {
  const cls = `sim-arrive flex min-h-11 w-full flex-col items-center justify-center rounded-xl border-2 px-1 text-center leading-tight ${selected ? "ring-2 ring-white/70 ring-offset-2 ring-offset-[#12140d]" : ""}`;
  const st = { borderColor: c, background: `${c}26`, color: c === C.clean ? "#a1a1aa" : c };
  const body = (<><span className="w-full truncate text-[11px] font-bold">{name}</span><span className="text-[10px] opacity-80">v{v} {tag}</span></>);
  return onClick
    ? <button type="button" aria-pressed={selected} aria-label={`${name}, ${tag}`} onClick={onClick} className={cls} style={st}>{body}</button>
    : <div className={cls} style={st}>{body}</div>;
}

export default function GitAreas({ title }: { title: string }) {
  const [a, setA] = useState<Areas>(initAreas);
  const [sel, setSel] = useState(FILES[0] as string);
  const run = (f: (x: Areas) => Areas) => setA(f);
  const fl = FILES.map((n) => [n, a.files[n]!] as const);

  return (
    <Frame title={title} hint="Ketuk file di Working directory untuk memilihnya, lalu jalankan perintah Git dan lihat perubahannya berpindah dari area ke area.">
      <div className="sim-stage p-2 sm:p-3">
        <div className="grid grid-cols-4 gap-1.5">
          {COLS.map((c, i) => (
            <div key={c} className="flex flex-col gap-1.5">
              <p className="flex min-h-8 items-end justify-center text-center text-[11px] leading-tight font-extrabold text-zinc-300">{c}{i < 3 && <span aria-hidden className="ml-0.5 text-[#b5d36f]">›</span>}</p>
              <div className="flex min-h-40 flex-col gap-1.5 rounded-xl bg-white/[0.04] p-1">
                {i === 0 && fl.map(([n, f]) => <Chip key={`${n}${f.w}${modified(f)}`} name={n} v={f.w} c={modified(f) ? C.modified : C.clean} tag={modified(f) ? "modified" : "bersih"} selected={n === sel} onClick={() => setSel(n)} />)}
                {i === 1 && fl.filter(([, f]) => staged(f)).map(([n, f]) => <Chip key={`${n}${f.s}`} name={n} v={f.s} c={C.staged} tag="staged" />)}
                {i === 2 && fl.filter(([, f]) => ahead(f)).map(([n, f]) => <Chip key={`${n}${f.r}`} name={n} v={f.r} c={C.committed} tag="committed" />)}
                {i === 3 && fl.map(([n, f]) => <Chip key={`${n}${f.o}${f.t}`} name={n} v={f.o} c={f.t ? C.theirs : C.clean} tag={f.t ? "dari rekan" : "tersinkron"} />)}
                {((i === 1 && !fl.some(([, f]) => staged(f))) || (i === 2 && !fl.some(([, f]) => ahead(f)))) && <p className="m-auto text-center text-[10px] text-zinc-600">kosong</p>}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 rounded-xl bg-black/50 px-3 py-2 font-mono text-xs" aria-live="polite">
          <p className="break-all"><span className="text-[#b5d36f]">$</span> {a.cmd}</p>
          <p className={`mt-1 font-sans ${a.err ? "text-[#f5a98e]" : "text-zinc-400"}`}>{a.note}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => run((x) => edit(x, sel))} className={simGhost}>Ubah {sel}</button>
        <button type="button" disabled={!canAdd(a, sel)} onClick={() => run((x) => add(x, sel))} className={simButton}>git add</button>
        <button type="button" disabled={!canCommit(a)} onClick={() => run(commit)} className={simButton}>git commit</button>
        <button type="button" disabled={!canPush(a)} onClick={() => run(push)} className={simButton}>git push</button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" disabled={!canUnstage(a, sel)} onClick={() => run((x) => unstage(x, sel))} className={simGhost}>git restore --staged</button>
        <button type="button" disabled={!canPull(a)} onClick={() => run(pull)} className={simGhost}>git pull</button>
        <button type="button" disabled={!canTeammate(a)} onClick={() => run(teammate)} className={simGhost}>Rekan push ke remote</button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
        {([["modified", C.modified], ["staged", C.staged], ["committed (belum di-push)", C.committed], ["dari rekan", C.theirs]] as const).map(([l, c]) => <span key={l} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: c }} />{l}</span>)}
        <button type="button" onClick={() => { setA(initAreas()); setSel(FILES[0] as string); }} className="min-h-11 px-2 text-zinc-400 underline underline-offset-2">Reset</button>
      </div>
    </Frame>
  );
}
