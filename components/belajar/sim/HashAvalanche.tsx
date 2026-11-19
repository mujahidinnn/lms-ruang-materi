import { useEffect, useState } from "react";
import { bitDiff, bitDiffPercent, changeOneChar, diffIndexes, sha256Hex } from "../../../lib/sim/hash";
import Frame, { simButton } from "./Frame";

const input = "min-h-11 w-full rounded-xl border-2 border-noir bg-zinc-900 px-3 text-sm text-inherit";

function Hex({ hex, diff, label }: { hex: string; diff?: Set<number>; label: string }) {
  const groups = Array.from({ length: 8 }, (_, g) => hex.slice(g * 8, g * 8 + 8));
  return (
    <p role="img" aria-label={`${label}: ${hex || "menghitung"}`} className="flex min-h-12 flex-wrap gap-x-3 gap-y-1 font-mono text-[13px] leading-5">
      {hex ? groups.map((grp, g) => (
        <span key={g}>
          {[...grp].map((c, k) => {
            const hit = diff?.has(g * 8 + k);
            return <span key={k} className={hit ? "rounded-sm bg-[#f2c879]/30 text-[#f2c879]" : "text-zinc-300"}>{c}</span>;
          })}
        </span>
      )) : <span className="text-zinc-500">...</span>}
    </p>
  );
}

export default function HashAvalanche({ title }: { title: string }) {
  const [text, setText] = useState("halo dunia");
  const [n, setN] = useState(0);
  const [on, setOn] = useState(false);
  const [h1, setH1] = useState("");
  const [h2, setH2] = useState("");
  const alt = changeOneChar(text, n);
  const at = [...alt].findIndex((c, i) => c !== text[i]);

  useEffect(() => {
    let live = true;
    sha256Hex(text).then((h) => live && setH1(h));
    sha256Hex(alt).then((h) => live && setH2(h));
    return () => { live = false; };
  }, [text, alt]);

  const ready = h1 && h2;
  const diff = on && ready ? diffIndexes(h1, h2) : undefined;
  const bits = ready ? bitDiff(h1, h2) : 0;
  const pct = ready ? bitDiffPercent(h1, h2) : 0;

  return (
    <Frame title={title} hint="Ketik apa saja, lalu ubah satu huruf. Panjang hash tetap 64 karakter, tetapi isinya berubah total.">
      <label className="grid gap-1 text-sm font-bold">Teks masukan
        <input value={text} onChange={(e) => { setText(e.target.value); setN(0); setOn(false); }} className={input} spellCheck={false} />
      </label>
      <div className="sim-stage mt-3 p-3 sm:p-4">
        <p className="text-xs font-bold text-[#b5d36f]">SHA-256 asli <span className="font-normal text-zinc-400">({text.length} karakter masuk, 64 karakter hex keluar)</span></p>
        <Hex hex={h1} label="Hash teks asli" />
        <p className="mt-3 break-all text-xs font-bold text-[#8fc5ea]">
          Setelah satu huruf berubah: <span className="font-mono font-normal text-zinc-300">{[...alt].map((c, i) => <span key={i} className={i === at && on ? "rounded-sm bg-[#8fc5ea]/30 text-[#8fc5ea]" : ""}>{c}</span>)}</span>
        </p>
        <Hex hex={on ? h2 : ""} diff={diff} label="Hash teks yang diubah" />
        {on && ready && (
          <div aria-live="polite" className="sim-pop mt-3">
            <div className="h-3 overflow-hidden rounded-full bg-zinc-800" role="img" aria-label={`${pct.toFixed(0)} persen bit berbeda`}>
              <div className="h-full rounded-full bg-[#f2c879]" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-sm font-bold text-[#f2c879]">{bits} dari 256 bit berbeda ({pct.toFixed(1)}%)</p>
            <p className="text-xs text-zinc-400">{diff!.size} dari 64 karakter hex berubah. Perubahan sekecil apa pun mengacak sekitar separuh bit: inilah efek avalanche.</p>
          </div>
        )}
        <p className="mt-3 text-xs text-zinc-400">Satu arah: dari hash, teks aslinya tidak bisa dihitung balik.</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={!text} onClick={() => { if (on) setN(n + 1); setOn(true); }} className={simButton}>Ubah satu huruf</button>
      </div>
    </Frame>
  );
}
