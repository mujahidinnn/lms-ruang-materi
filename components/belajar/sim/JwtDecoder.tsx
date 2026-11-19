import { useEffect, useMemo, useState } from "react";
import { type Check, HEADER, encodeJson, hmac, verify } from "../../../lib/sim/jwt";
import Frame, { simButton, simGhost } from "./Frame";

const EXP = [
  { label: "1 jam lagi", s: 3600 },
  { label: "1 menit lagi", s: 60 },
  { label: "sudah lewat", s: -60 },
];
const COLORS = { h: "#f2a6c9", p: "#8fc5ea", s: "#b5d36f" };
const input = "min-h-11 w-full rounded-xl border-2 border-noir bg-zinc-900 px-3 text-sm text-inherit";

export default function JwtDecoder({ title }: { title: string }) {
  const [now] = useState(() => Math.floor(Date.now() / 1000));
  const [sub, setSub] = useState("42");
  const [role, setRole] = useState("user");
  const [exp, setExp] = useState(0);
  const [secret, setSecret] = useState("rahasia-server");
  const [forged, setForged] = useState<string | null>(null);
  const [sig, setSig] = useState("");
  const [check, setCheck] = useState<Check | null>(null);

  const payload = useMemo(() => ({ sub, role, iat: now, exp: now + EXP[exp].s }), [sub, role, exp, now]);
  const h = useMemo(() => encodeJson(HEADER), []);
  const honest = useMemo(() => encodeJson(payload), [payload]);
  const p = forged ?? honest;

  // Signature always covers the honest payload; a forged payload keeps the old signature.
  useEffect(() => {
    let live = true;
    hmac(secret, `${h}.${honest}`).then((s) => live && setSig(s));
    return () => { live = false; };
  }, [secret, h, honest]);

  const token = `${h}.${p}.${sig}`;
  useEffect(() => {
    if (!sig) return;
    let live = true;
    verify(token, secret, now).then((c) => live && setCheck(c));
    return () => { live = false; };
  }, [token, secret, now, sig]);

  const edit = <T,>(set: (v: T) => void) => (v: T) => { setForged(null); set(v); };
  const tamper = () => setForged(encodeJson({ ...payload, role: "admin", exp: now + 31536000 }));
  const bad = check?.signature === "invalid";
  const shown = check?.payload ?? payload;

  return (
    <Frame title={title} hint="Ubah isi payload dan lihat token terbentuk. Lalu coba ubah payload tanpa tanda tangan ulang: server menolaknya.">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-bold">sub (id pengguna)
          <input value={sub} onChange={(e) => edit(setSub)(e.target.value)} className={input} />
        </label>
        <label className="grid gap-1 text-sm font-bold">role
          <select value={role} onChange={(e) => edit(setRole)(e.target.value)} className={input}>
            <option value="user">user</option><option value="editor">editor</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-bold">exp (kedaluwarsa)
          <select value={exp} onChange={(e) => edit(setExp)(+e.target.value)} className={input}>
            {EXP.map((x, i) => <option key={x.label} value={i}>{x.label}</option>)}
          </select>
        </label>
      </div>
      <label className="mt-3 grid gap-1 text-sm font-bold">Secret server
        <input value={secret} onChange={(e) => edit(setSecret)(e.target.value)} className={`${input} font-mono`} spellCheck={false} />
      </label>

      <div className="sim-stage mt-4 p-3 sm:p-4">
        <p className="break-all font-mono text-[13px] leading-6" aria-label="Token JWT" role="img">
          <span style={{ color: COLORS.h }}>{h}</span>.<span key={p} className="sim-pop inline-block max-w-full break-all" style={{ color: COLORS.p }}>{p}</span>.<span style={{ color: COLORS.s }}>{sig}</span>
        </p>
        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
          <div className="rounded-xl p-2" style={{ background: `${COLORS.h}1f` }}><b style={{ color: COLORS.h }}>Header</b><pre className="mt-1 whitespace-pre-wrap font-mono text-zinc-300">{JSON.stringify(HEADER)}</pre></div>
          <div className="rounded-xl p-2" style={{ background: `${COLORS.p}1f` }}><b style={{ color: COLORS.p }}>Payload (terbaca siapa saja)</b><pre className="mt-1 whitespace-pre-wrap break-all font-mono text-zinc-300">{JSON.stringify(shown)}</pre></div>
          <div className="rounded-xl p-2" style={{ background: `${COLORS.s}1f` }}><b style={{ color: COLORS.s }}>Tanda tangan</b><p className="mt-1 font-mono text-zinc-300">HMAC-SHA256(header.payload, secret)</p></div>
        </div>
        <div aria-live="polite" className="mt-3 grid gap-1 text-sm font-bold">
          <p className={bad ? "text-[#f08a7a]" : "text-[#b5d36f]"}>{check ? (bad ? "Verifikasi GAGAL: payload tidak cocok dengan tanda tangan." : "Verifikasi berhasil: tanda tangan cocok.") : "Menghitung..."}</p>
          {check?.signature === "valid" && (check.expired ? <p className="text-[#f2c879]">Token kedaluwarsa: server menolak walau tanda tangannya sah.</p> : <p className="text-zinc-300">Token masih berlaku.</p>)}
          {bad && <p className="font-normal text-zinc-400">Server menghitung ulang tanda tangan dan hasilnya berbeda, jadi isi payload dianggap palsu.</p>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={tamper} disabled={!!forged} className={simButton}>Ubah payload jadi admin</button>
        <button type="button" onClick={() => setForged(null)} disabled={!forged} className={simGhost}>Pulihkan token</button>
      </div>
    </Frame>
  );
}
