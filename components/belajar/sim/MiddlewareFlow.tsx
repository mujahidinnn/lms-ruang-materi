import { useEffect, useState } from "react";
import { catatan, jalankan, permintaan, type Db, type Isi, type Skenario, type Token } from "@/lib/sim/middleware-flow";
import Frame, { reducedMotion, simButton, simGhost } from "./Frame";
import Chips, { snippet } from "./Chips";

const TOKEN = ["benar", "salah", "tak ada"] as const;
const ISI = ["valid", "tidak valid"] as const;
const DB = ["normal", "gagal"] as const;
const TANDA = { next: "next()", respons: "membalas", error: "next(err)", "tak tercapai": "tidak jalan" } as const;
const GAYA = {
  next: "border-matcha-300 text-matcha-300",
  respons: "border-[#f0b36a] text-[#f0b36a]",
  error: "border-[#ff8a80] text-[#ff8a80]",
  "tak tercapai": "border-zinc-600 text-zinc-500",
} as const;
const warnaStatus = (n: number) => (n === 200 ? "text-matcha-300" : n === 500 ? "text-[#ff8a80]" : "text-[#f0b36a]");

export default function MiddlewareFlow({ title }: { title: string }) {
  const [s, setS] = useState<Skenario>({ token: "benar", isi: "valid", db: "normal" });
  const [tukar, setTukar] = useState(false);
  const [n, setN] = useState(-1); // -1 belum dikirim; n = jumlah langkah yang sudah tampil
  const r = jalankan(tukar, s);
  const total = r.langkah.length;
  const ubah = (f: () => void) => { f(); setN(-1); };

  useEffect(() => {
    if (n < 0 || n >= total) return;
    const t = setTimeout(() => setN(n + 1), 450);
    return () => clearTimeout(t);
  }, [n, total]);

  const kirim = () => setN(reducedMotion() ? total : 0);
  const selesai = n >= total;
  const sibuk = n >= 0 && !selesai;

  return (
    <Frame title={title} hint="Pilih skenario, lalu kirim request. Lihat middleware mana yang memanggil next() dan mana yang langsung membalas. Tukar urutan auth dan validasi untuk melihat bahwa urutan menentukan hasil.">
      <div className="sim-stage grid gap-4 p-3 sm:grid-cols-2">
        <ol aria-label="Rantai middleware" className="grid gap-1">
          {r.langkah.map((l, i) => {
            const tampil = n >= 0 && i < n;
            const aktif = sibuk && i === n;
            return (
              <li key={l.nama} className="grid gap-1">
                <div className={`flex items-center justify-between gap-2 rounded-xl border-2 px-3 py-2 ${tampil ? GAYA[l.hasil] : aktif ? "border-white text-white" : "border-zinc-700 text-zinc-400"}`}>
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold">{i + 1}. {l.nama}</p>
                    <p className="text-xs text-zinc-300">{tampil ? l.ket : aktif ? "memproses..." : "menunggu"}</p>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-bold">{tampil ? TANDA[l.hasil] : ""}</span>
                </div>
                {i < total - 1 && <span aria-hidden className="text-center font-mono text-xs text-zinc-500">{tampil && l.hasil === "next" ? "↓ next()" : tampil && l.hasil === "error" ? "↓ next(err)" : "↓"}</span>}
              </li>
            );
          })}
        </ol>
        <div className="grid content-start gap-3">
          <div>
            <p className="mb-1 text-xs font-bold text-zinc-400">Request</p>
            <pre className="overflow-x-auto rounded-xl bg-[#0a0c06] p-3 font-mono text-xs leading-relaxed text-zinc-200">{permintaan(s).join("\n")}</pre>
          </div>
          <div aria-live="polite">
            <p className="mb-1 text-xs font-bold text-zinc-400">Respons</p>
            <div className="rounded-xl bg-[#0a0c06] p-3 font-mono text-xs leading-relaxed">
              {selesai ? (
                <>
                  <p className={`text-base font-bold ${warnaStatus(r.status)}`}>{r.status}</p>
                  <p className="text-zinc-200">{r.isi}</p>
                  <p className="mt-2 text-zinc-500">log: {r.log}</p>
                </>
              ) : (
                <p className="text-zinc-500">{sibuk ? "menunggu..." : "belum ada request"}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <p aria-live="polite" className="mt-3 min-h-12 text-sm text-zinc-300">{selesai ? catatan(tukar, s) : " "}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Chips<Token> label="Token" value={s.token} options={TOKEN} onChange={(v) => ubah(() => setS((o) => ({ ...o, token: v })))} />
        <Chips<Isi> label="Body" value={s.isi} options={ISI} onChange={(v) => ubah(() => setS((o) => ({ ...o, isi: v })))} />
        <Chips<Db> label="Database" value={s.db} options={DB} onChange={(v) => ubah(() => setS((o) => ({ ...o, db: v })))} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={kirim} disabled={sibuk} className={simButton}>Kirim request</button>
        <button type="button" aria-pressed={tukar} onClick={() => ubah(() => setTukar((v) => !v))} className={tukar ? simButton : simGhost}>Tukar urutan auth dan validasi</button>
      </div>
      <pre className={snippet} aria-label="Urutan pendaftaran middleware">{`app.use(logger);\n${tukar ? "app.use(validasi);\napp.use(auth);" : "app.use(auth);\napp.use(validasi);"}\napp.post("/kelas", handler);\napp.use(errorHandler);`}</pre>
    </Frame>
  );
}
