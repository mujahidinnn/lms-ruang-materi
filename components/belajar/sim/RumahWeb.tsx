import { useState } from "react";
import { catatan, keadaan, KODE, type Layers } from "@/lib/sim/rumah-web";
import Frame, { simButton, simGhost } from "./Frame";
import { snippet } from "./Chips";

const PILAR = [
  ["html", "HTML: kerangka"],
  ["css", "CSS: cat dan perabot"],
  ["js", "JavaScript: listrik"],
] as const;
const LABEL = "text-[10px] fill-[#bfc0b5] font-mono";

export default function RumahWeb({ title }: { title: string }) {
  const [l, setL] = useState<Layers>({ html: true, css: false, js: false });
  const [lampu, setLampu] = useState(false);
  const [pintu, setPintu] = useState(false);
  const k = keadaan(l);
  const toggle = (key: keyof Layers) => {
    setL((o) => ({ ...o, [key]: !o[key] }));
    if (key === "js") { setLampu(false); setPintu(false); }
  };
  const garis = k.berwarna ? { stroke: "#12140d", strokeWidth: 2 } : { stroke: "#bfc0b5", strokeWidth: 1.5, strokeDasharray: "4 3" };
  const warna = (c: string) => (k.berwarna ? c : "none");

  return (
    <Frame title={title} hint="Nyalakan satu per satu: kerangka (HTML), cat dan perabot (CSS), listrik (JavaScript). Lihat apa yang berubah dan apa yang tidak.">
      <div className="sim-stage p-3">
        <svg viewBox="0 0 480 290" role="img" aria-label={catatan(l)} className="mx-auto block w-full max-w-xl">
          <defs><clipPath id="rw-dalam"><rect x="100" y="130" width="280" height="132" /></clipPath></defs>
          <line x1="20" y1="262" x2="460" y2="262" stroke="#5c5e54" strokeWidth="2" />
          {k.elemen && (
            <g {...garis} strokeLinejoin="round">
              <polygon points="70,130 240,52 410,130" fill={warna("#5c5e54")} />
              <rect x="100" y="130" width="280" height="132" fill={warna("#d6ea9c")} />
              {lampu && <circle cx="330" cy="168" r="78" fill="#ffe58a" fillOpacity={0.3} stroke="none" clipPath="url(#rw-dalam)" />}
              <rect x="125" y="160" width="64" height="50" fill={warna(lampu ? "#fff3b8" : "#e8efd6")} />
              {k.berwarna && <path d="M157 160v50M125 185h64" strokeWidth="1.5" />}
              <rect x="215" y="190" width="50" height="72" fill={pintu ? "#12140d" : warna("#f0b36a")} />
              {pintu && <polygon points="215,190 232,196 232,258 215,262" fill={warna("#f0b36a")} />}
              {k.berwarna && !pintu && <circle cx="256" cy="228" r="3" fill="#12140d" />}
              <rect x="280" y="164" width="12" height="22" rx={k.berwarna ? 3 : 0} fill={warna("#12140d")} />
              {k.berwarna && <rect x="283" y={lampu ? 167 : 175} width="6" height="8" fill="#f4f7ea" stroke="none" />}
              <path d="M330 130v29" fill="none" />
              <circle cx="330" cy="168" r="9" fill={lampu ? "#ffd84d" : warna("#e8efd6")} />
              <rect x="296" y="224" width="76" height="38" rx={k.berwarna ? 8 : 0} fill={warna("#7fb3d9")} />
              {k.berwarna && <path d="M296 224v-10h76v10M334 224v38" fill="none" strokeWidth="1.5" />}
            </g>
          )}
          {k.elemen && !k.berwarna && (
            <g className={LABEL} textAnchor="middle">
              <text x="240" y="112">&lt;header&gt;</text>
              <text x="140" y="146">&lt;main&gt;</text>
              <text x="157" y="188">&lt;img&gt;</text>
              <text x="240" y="230">&lt;a&gt;</text>
              <text x="286" y="200">&lt;button&gt;</text>
              <text x="330" y="192">&lt;span&gt;</text>
              <text x="334" y="248">&lt;section&gt;</text>
            </g>
          )}
          {!k.elemen && <text x="240" y="150" textAnchor="middle" className="fill-zinc-400 text-[13px]">Belum ada elemen</text>}
        </svg>
        <p aria-live="polite" className="mt-2 min-h-12 text-center text-sm text-zinc-300">{catatan(l)}</p>
      </div>
      <div role="group" aria-label="Pilar web" className="mt-3 flex flex-wrap gap-2">
        {PILAR.map(([key, label]) => (
          <button key={key} type="button" aria-pressed={l[key]} onClick={() => toggle(key)} className={l[key] ? simButton : simGhost}>{label}</button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" disabled={!k.hidup} onClick={() => setLampu((v) => !v)} className={simGhost}>{lampu ? "Matikan lampu" : "Nyalakan lampu"}</button>
        <button type="button" disabled={!k.hidup} onClick={() => setPintu((v) => !v)} className={simGhost}>{pintu ? "Tutup pintu" : "Buka pintu"}</button>
      </div>
      {!k.hidup && <p className="mt-1 text-xs text-zinc-400">Tombol ini baru aktif bila HTML dan JavaScript sama-sama menyala.</p>}
      <pre className={snippet} aria-label="Kode yang aktif">{(["html", "css", "js"] as const).filter((x) => l[x]).map((x) => KODE[x]).join("\n") || "// belum ada kode"}</pre>
    </Frame>
  );
}
