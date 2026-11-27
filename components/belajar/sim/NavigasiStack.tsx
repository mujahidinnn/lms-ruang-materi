import { useState } from "react";
import { awal, deepLink, gantiTab, label, pop, push, SKEMA, TABS, teratas, type Keadaan, type Tab } from "@/lib/sim/navigasi-stack";
import Frame, { simButton, simGhost } from "./Frame";
import Chips from "./Chips";

const ID = [7, 42, 99] as const;
const CONTOH = ["kelas/42", "kelas/42/bab/3", "profil", "kelas/abc"];
const TAB_LABEL: Record<Tab, string> = { beranda: "Beranda", kelas: "Kelas", profil: "Profil" };
const item = "flex min-h-11 w-full items-center justify-between rounded-lg bg-zinc-800 px-3 text-left text-sm text-zinc-100";

export default function NavigasiStack({ title }: { title: string }) {
  const [k, setK] = useState<Keadaan>(awal);
  const [id, setId] = useState<number>(42);
  const [tautan, setTautan] = useState(`${SKEMA}kelas/42/bab/3`);
  const [pesan, setPesan] = useState("Tumpukan tiap tab berdiri sendiri. Coba push beberapa layar, pindah tab, lalu kembali.");
  const atas = teratas(k);
  const tumpukan = k.tab[k.aktif];
  const lakukan = (n: Keadaan, p: string) => { setK(n); setPesan(p); };
  const pushDetail = (x: number) => lakukan(push(k, { nama: "detail", params: { id: String(x) } }), `push: layar kelas/${x} ditaruh di atas tumpukan tab ${k.aktif}. Parameter id selalu berupa teks: "${x}".`);
  const pushBab = () => lakukan(push(k, { nama: "bab", params: { id: atas.params!.id, bab: "1" } }), "push: layar bab ditaruh di atas kelas yang sedang dibuka.");
  const kembali = () => lakukan(pop(k), tumpukan.length === 1 ? "Sudah di dasar tumpukan, kembali tidak berefek." : `pop: ${label(atas)} diangkat, layar di bawahnya muncul lagi.`);
  const buka = (url: string) => { const r = deepLink(k, url); lakukan(r.keadaan, r.pesan); };
  const bukaContoh = (c: string) => { setTautan(SKEMA + c); buka(SKEMA + c); };

  return (
    <Frame title={title} hint="Push layar, kembali, dan ganti tab. Perhatikan tumpukan di samping ponsel: tiap tab menyimpan tumpukannya sendiri. Deep link membentuk tumpukan lengkap sekaligus.">
      <div className="sim-stage grid items-start gap-4 p-3 sm:grid-cols-[13rem_1fr]">
        <div role="group" aria-label={`Ponsel di tab ${k.aktif}, layar teratas ${label(atas)}`} className="mx-auto w-52 rounded-3xl border-4 border-zinc-600 bg-[#0a0c06] p-1.5">
          <div className="flex h-[22rem] flex-col overflow-hidden rounded-2xl bg-zinc-900">
            <div className="flex min-h-11 items-center gap-2 border-b border-zinc-800 px-2">
              <button type="button" aria-label="Kembali" disabled={tumpukan.length === 1} onClick={kembali} className="min-h-11 min-w-8 text-lg font-bold text-matcha-300 disabled:text-zinc-700">←</button>
              <span className="truncate font-mono text-xs font-bold text-zinc-100">{label(atas)}</span>
            </div>
            <div className="grid flex-1 content-start gap-2 overflow-y-auto p-2" aria-live="polite">
              {atas.nama === "daftar" && [7, 42, 99].map((x) => <button key={x} type="button" onClick={() => pushDetail(x)} className={item}>Kelas {x}<span aria-hidden>›</span></button>)}
              {atas.nama === "detail" && (
                <>
                  <p className="text-sm font-bold text-zinc-100">Kelas {atas.params!.id}</p>
                  <p className="font-mono text-xs text-zinc-400">id = "{atas.params!.id}"</p>
                  <button type="button" onClick={pushBab} className={item}>Buka bab 1<span aria-hidden>›</span></button>
                </>
              )}
              {atas.nama === "bab" && (
                <>
                  <p className="text-sm font-bold text-zinc-100">Bab {atas.params!.bab}</p>
                  <p className="font-mono text-xs text-zinc-400">id = "{atas.params!.id}", bab = "{atas.params!.bab}"</p>
                </>
              )}
              {atas.nama === "beranda" && <p className="text-sm text-zinc-300">Selamat datang kembali.</p>}
              {atas.nama === "profil" && <p className="text-sm text-zinc-300">Profil pengguna.</p>}
            </div>
            <div role="tablist" aria-label="Tab" className="grid grid-cols-3 border-t border-zinc-800">
              {TABS.map((t) => (
                <button key={t} type="button" role="tab" aria-selected={k.aktif === t} onClick={() => lakukan(gantiTab(k, t), `Pindah ke tab ${t}. Tumpukannya tetap ${k.tab[t].length} layar.`)} className="min-h-11 text-xs font-bold text-zinc-400 aria-selected:bg-matcha-300 aria-selected:text-noir">{TAB_LABEL[t]}</button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold text-zinc-400">Tumpukan per tab (atas = layar yang terlihat)</p>
          <div className="grid grid-cols-3 gap-2">
            {TABS.map((t) => (
              <div key={t} className={`rounded-xl border-2 p-2 ${k.aktif === t ? "border-matcha-300" : "border-zinc-700 opacity-80"}`}>
                <p className={`mb-1 text-xs font-bold ${k.aktif === t ? "text-matcha-300" : "text-zinc-400"}`}>{TAB_LABEL[t]}</p>
                <ol aria-label={`Tumpukan tab ${t}`} className="flex flex-col-reverse gap-1">
                  {k.tab[t].map((l, i, a) => (
                    <li key={i} className={`break-words rounded-lg px-1.5 py-1 font-mono text-[11px] leading-tight ${i === a.length - 1 ? "bg-zinc-100 font-bold text-noir" : "bg-zinc-800 text-zinc-300"}`}>{label(l).replaceAll("/", "/\u200b")}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p aria-live="polite" className="mt-3 min-h-12 text-sm text-zinc-300">{pesan}</p>
      <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
        <Chips<number> label="id kelas" value={id} options={ID} onChange={setId} />
        <div className="flex flex-wrap items-end gap-2">
          <button type="button" onClick={() => pushDetail(id)} className={simButton}>Push kelas/{id}</button>
          <button type="button" disabled={atas.nama !== "detail"} onClick={pushBab} className={simGhost}>Push bab 1</button>
          <button type="button" disabled={tumpukan.length === 1} onClick={kembali} className={simGhost}>Pop (kembali)</button>
        </div>
      </div>
      <form className="mt-3 grid gap-1" onSubmit={(e) => { e.preventDefault(); buka(tautan.trim()); }}>
        <label htmlFor="ns-link" className="text-sm font-bold">Deep link</label>
        <div className="flex flex-wrap gap-2">
          <input id="ns-link" value={tautan} onChange={(e) => setTautan(e.target.value)} spellCheck={false} className="min-h-11 min-w-0 flex-1 rounded-full border-2 border-noir bg-zinc-800 px-4 font-mono text-sm" />
          <button type="submit" className={simButton}>Buka</button>
        </div>
        <div className="flex flex-wrap gap-1">
          {CONTOH.map((c) => <button key={c} type="button" onClick={() => bukaContoh(c)} className="min-h-11 rounded-full border-2 border-zinc-700 px-3 font-mono text-xs text-zinc-300">{c}</button>)}
        </div>
      </form>
    </Frame>
  );
}
