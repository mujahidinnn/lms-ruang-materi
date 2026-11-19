import { useLayoutEffect, useRef, useState } from "react";
import Chips, { snippet } from "./Chips";
import Frame, { reducedMotion } from "./Frame";

const HEIGHTS = [28, 48, 36, 56, 32];
const GRIDS = ["repeat(3, 1fr)", "repeat(2, 1fr)", "1fr 2fr", "repeat(auto-fit, minmax(70px, 1fr))"] as const;

export default function Flexbox({ title }: { title: string }) {
  const [mode, setMode] = useState<"flex" | "grid">("flex");
  const [dir, setDir] = useState<"row" | "column">("row");
  const [justify, setJustify] = useState<"flex-start" | "center" | "flex-end" | "space-between" | "space-around">("flex-start");
  const [align, setAlign] = useState<"stretch" | "flex-start" | "center" | "flex-end">("flex-start");
  const [wrap, setWrap] = useState<"nowrap" | "wrap">("nowrap");
  const [gap, setGap] = useState(8);
  const [cols, setCols] = useState<(typeof GRIDS)[number]>(GRIDS[0]);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const prev = useRef<DOMRect[]>([]);

  // FLIP: jump to the old position, then let the transition carry each box to the new one.
  useLayoutEffect(() => {
    const els = refs.current.filter((e): e is HTMLDivElement => !!e);
    const next = els.map((e) => e.getBoundingClientRect());
    if (!reducedMotion() && prev.current.length === els.length) {
      els.forEach((e, i) => {
        const dx = prev.current[i].left - next[i].left, dy = prev.current[i].top - next[i].top;
        if (!dx && !dy) return;
        e.style.transition = "none";
        e.style.transform = `translate(${dx}px, ${dy}px)`;
        void e.offsetWidth;
        e.style.transition = "transform 0.4s cubic-bezier(.2,.8,.2,1)";
        e.style.transform = "";
      });
    }
    prev.current = next;
  });

  const isFlex = mode === "flex";
  const css = isFlex
    ? `.wadah {\n  display: flex;\n  flex-direction: ${dir};\n  justify-content: ${justify};\n  align-items: ${align};\n  flex-wrap: ${wrap};\n  gap: ${gap}px;\n}`
    : `.wadah {\n  display: grid;\n  grid-template-columns: ${cols};\n  gap: ${gap}px;\n}`;

  return (
    <Frame title={title} hint="Ubah properti wadah, lalu lihat lima kotak berpindah. Flexbox mengatur satu sumbu, Grid mengatur baris dan kolom sekaligus.">
      <div className="sim-stage p-3">
        <div
          role="img"
          aria-label={`Lima kotak dalam wadah ${mode}`}
          className="h-60 overflow-hidden rounded-lg border border-dashed border-matcha-300/50 p-2"
          style={isFlex ? { display: "flex", flexDirection: dir, justifyContent: justify, alignItems: align, flexWrap: wrap, gap } : { display: "grid", gridTemplateColumns: cols, gap, alignContent: "start", alignItems: "start" }}
        >
          {HEIGHTS.map((h, i) => (
            <div key={i} ref={(el) => { refs.current[i] = el; }} className="grid place-items-center rounded-lg border-2 border-noir bg-matcha-300 text-sm font-extrabold text-[#12140d]" style={{ width: isFlex && !(align === "stretch" && dir === "column") ? 52 : undefined, height: isFlex && align === "stretch" && dir === "row" ? undefined : h, flexShrink: 0 }}>{i + 1}</div>
          ))}
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Chips label="Tata letak" value={mode} options={["flex", "grid"] as const} onChange={setMode} />
        <Chips label="gap (px)" value={gap} options={[0, 8, 16, 24] as const} onChange={setGap} />
        {isFlex ? (
          <>
            <Chips label="flex-direction" value={dir} options={["row", "column"] as const} onChange={setDir} />
            <Chips label="flex-wrap" value={wrap} options={["nowrap", "wrap"] as const} onChange={setWrap} />
            <Chips label="justify-content" value={justify} options={["flex-start", "center", "flex-end", "space-between", "space-around"] as const} onChange={setJustify} />
            <Chips label="align-items" value={align} options={["stretch", "flex-start", "center", "flex-end"] as const} onChange={setAlign} />
          </>
        ) : (
          <Chips label="grid-template-columns" value={cols} options={GRIDS} onChange={setCols} />
        )}
      </div>
      <pre className={snippet}>{css}</pre>
    </Frame>
  );
}
