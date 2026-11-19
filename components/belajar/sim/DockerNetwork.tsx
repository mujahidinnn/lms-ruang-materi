import { useState } from "react";
import { commands, hostToWeb, IP, type Net, type Result, type Target, webToDb } from "@/lib/sim/docker-network";
import Frame, { simButton, simChip, simGhost } from "./Frame";

const NETS: { id: Net; label: string }[] = [
  { id: "bridge", label: "Bridge bawaan" },
  { id: "user", label: "Network buatan (app-net)" },
];

const Box = ({ name, sub, ok }: { name: string; sub: string; ok?: boolean }) => (
  <div className={`min-w-0 rounded-xl border-2 p-2 text-center ${ok ? "border-[#b5d36f] bg-[#1d2014]" : "border-zinc-600 bg-black/30"}`}>
    <p className="text-sm font-extrabold">{name}</p>
    <p className="break-all font-mono text-[10px] text-zinc-400">{sub}</p>
  </div>
);

export default function DockerNetwork({ title }: { title: string }) {
  const [net, setNet] = useState<Net>("bridge");
  const [pub, setPub] = useState(false);
  const [by, setBy] = useState<Target>("name");
  const [res, setRes] = useState<(Result & { from: "web" | "host" }) | null>(null);
  const ips = IP[net];
  const set = (f: () => void) => { f(); setRes(null); };

  return (
    <Frame title={title} hint="Pilih network dan port, lalu coba hubungi dari web ke db (lewat nama atau IP) dan dari host ke web.">
      <div className="flex flex-wrap gap-1 rounded-3xl bg-zinc-800 p-1" role="group" aria-label="Network">
        {NETS.map((n) => <button key={n.id} type="button" aria-pressed={net === n.id} onClick={() => set(() => setNet(n.id))} className={`${simChip} grow`}>{n.label}</button>)}
      </div>
      <button type="button" aria-pressed={pub} onClick={() => set(() => setPub(!pub))} className={`${simGhost} mt-2 w-full aria-pressed:border-[#b5d36f] aria-pressed:text-[#b5d36f] sm:w-auto`}>
        {pub ? "Port dipublikasikan: -p 8080:80" : "Tanpa publikasi port"}
      </button>

      <div className="sim-stage mt-3 p-3 sm:p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-1">
          <div className="col-span-3"><Box name="Host" sub="localhost:8080" /></div>
          <div aria-hidden className={`col-start-1 mx-auto h-6 w-0 border-l-2 border-dashed ${pub ? "border-[#b5d36f] sim-blink" : "border-zinc-700"}`} />
          <p className="col-span-2 text-[11px] text-zinc-400">{pub ? "8080 pada host diteruskan ke 80" : "tidak ada port terbuka ke host"}</p>
        </div>
        <div className="rounded-xl border-2 border-dashed border-zinc-600 p-2">
          <p className="mb-2 text-[11px] font-bold text-zinc-300">{net === "user" ? "network app-net (DNS aktif)" : "network bridge (tanpa DNS nama)"}</p>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
            <Box name="web" sub={ips.web} ok />
            <span aria-hidden className={`text-lg ${res?.from === "web" ? (res.ok ? "text-[#7ee081]" : "text-red-400") : "text-zinc-600"}`}>{res?.from === "web" && !res.ok ? "✕" : "↔"}</span>
            <Box name="db" sub={ips.db} ok />
          </div>
        </div>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-black/40 p-3 font-mono text-[11px] leading-5 text-zinc-200 sm:text-xs" aria-label="Perintah Docker"><code>{commands(net, pub).join("\n")}</code></pre>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1" role="group" aria-label="Alamat tujuan dari web">
        <span className="px-2 text-sm text-zinc-400">web memanggil db lewat:</span>
        {(["name", "ip"] as Target[]).map((t) => <button key={t} type="button" aria-pressed={by === t} onClick={() => set(() => setBy(t))} className={simChip}>{t === "name" ? "nama (db)" : `IP (${ips.db})`}</button>)}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => setRes({ ...webToDb(net, by), from: "web" })} className={simButton}>web ping db</button>
        <button type="button" onClick={() => setRes({ ...hostToWeb(pub), from: "host" })} className={simGhost}>host curl web</button>
      </div>

      <div aria-live="polite" className="mt-3 min-h-16 text-sm">
        {res ? <>
          <code className="block break-all font-mono text-xs text-zinc-400">$ {res.cmd}</code>
          <p className={`mt-1 font-bold ${res.ok ? "text-[#7ee081]" : "text-red-400"}`}>{res.msg}</p>
        </> : <p className="text-zinc-400">Jalankan salah satu tes di atas.</p>}
      </div>
    </Frame>
  );
}
