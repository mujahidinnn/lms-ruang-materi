"use client";

import { Upload } from "lucide-react";
import { useId, useState } from "react";
import { isSvg, svgSrc, TRACK_PRESETS, TrackIcon } from "@/components/ui/icons";
import { field } from "./editor";

// Submits one value as `icon`: "" (automatic), a preset key, or SVG markup.
export default function IconPicker({ slug, defaultValue }: { slug?: string; defaultValue?: string | null }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [svg, setSvg] = useState(isSvg(defaultValue) ? defaultValue : "");
  const [err, setErr] = useState("");
  const name = useId();
  const custom = isSvg(value);
  const tile = "grid size-14 place-items-center rounded-xl bg-zinc-800 peer-checked:ring-2 peer-checked:ring-accent peer-focus-visible:outline-2 peer-focus-visible:outline-accent hover:bg-zinc-700";

  function pick(v: string) {
    setValue(v);
    if (!isSvg(v)) setSvg("");
  }

  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 8192) return setErr("File SVG maksimal 8 KB.");
    const text = (await file.text()).trim();
    if (!isSvg(text)) return setErr("File bukan SVG yang valid.");
    setErr("");
    setSvg(text);
    setValue(text);
  }

  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm text-zinc-400">Ikon</legend>
      <input type="hidden" name="icon" value={value} />
      <div role="radiogroup" className="flex flex-wrap gap-2">
        <label className="cursor-pointer" title="Otomatis dari slug">
          <input type="radio" name={name} checked={value === ""} onChange={() => pick("")} className="peer sr-only" />
          <span className={`${tile} text-xs text-zinc-400`}>Auto</span>
        </label>
        {Object.entries(TRACK_PRESETS).map(([key, [label, Icon]]) => (
          <label key={key} className="cursor-pointer" title={label}>
            <input type="radio" name={name} checked={value === key} onChange={() => pick(key)} className="peer sr-only" />
            <span className={tile}><Icon className="size-8" /></span>
            <span className="sr-only">{label}</span>
          </label>
        ))}
        <label className="cursor-pointer" title="Unggah file SVG">
          <input type="file" accept=".svg,image/svg+xml" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} className="peer sr-only" />
          <span className={tile}>{custom ? <img src={svgSrc(value)} alt="" className="size-8 object-contain" /> : <Upload aria-hidden className="size-5 text-zinc-400" />}</span>
          <span className="sr-only">Unggah file SVG</span>
        </label>
      </div>
      <p aria-live="polite" className="text-xs text-red-500 empty:hidden">{err}</p>
      <label className="text-sm text-zinc-400">
        SVG sendiri
        <textarea
          rows={3}
          value={svg}
          onChange={(e) => { setSvg(e.target.value); setValue(e.target.value.trim()); }}
          placeholder='<svg viewBox="0 0 48 48">...</svg>'
          spellCheck={false}
          className={`${field} mt-1 font-mono text-xs`}
        />
        <span className="block text-xs text-zinc-500">Unggah file .svg lewat tombol di atas atau tempel kodenya, maksimal 8 KB. Warna dari file SVG dipakai apa adanya, tanpa mengikuti tema.</span>
      </label>
      {slug && value === "" && (
        <p className="flex items-center gap-2 text-xs text-zinc-500"><TrackIcon slug={slug} className="size-6" />Ikon otomatis untuk slug ini.</p>
      )}
    </fieldset>
  );
}
