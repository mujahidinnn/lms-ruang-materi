export type Variant = "tanpa" | "biasa" | "defer" | "async";
export type Lane = "parse" | "fetch" | "exec" | "css";
export type Bar = { lane: Lane; start: number; end: number; label: string; block?: boolean };

const HEAD = 2, BODY = 4, FETCH = 3, EXEC = 1, CSS_FETCH = 2, CSSOM = 1;

// Linimasa dalam satuan waktu abstrak. `paint` = awal render tree, layout, paint.
export function timeline(v: Variant) {
  const bars: Bar[] = [
    { lane: "css", start: 0, end: CSS_FETCH, label: "Unduh CSS" },
    { lane: "css", start: CSS_FETCH, end: CSS_FETCH + CSSOM, label: "CSSOM" },
  ];
  let parseEnd: number, dcl: number;
  if (v === "tanpa") {
    bars.push({ lane: "parse", start: 0, end: HEAD + BODY, label: "Parse HTML" });
    parseEnd = dcl = HEAD + BODY;
  } else if (v === "biasa") {
    const f = HEAD + FETCH, e = f + EXEC;
    bars.push(
      { lane: "parse", start: 0, end: HEAD, label: "Parse head" },
      { lane: "fetch", start: HEAD, end: f, label: "Unduh script", block: true },
      { lane: "exec", start: f, end: e, label: "Jalankan", block: true },
      { lane: "parse", start: e, end: e + BODY, label: "Parse body" },
    );
    parseEnd = dcl = e + BODY;
  } else if (v === "defer") {
    parseEnd = HEAD + BODY;
    bars.push(
      { lane: "parse", start: 0, end: parseEnd, label: "Parse HTML" },
      { lane: "fetch", start: HEAD, end: HEAD + FETCH, label: "Unduh script" },
      { lane: "exec", start: parseEnd, end: parseEnd + EXEC, label: "Jalankan" },
    );
    dcl = parseEnd + EXEC;
  } else {
    const f = HEAD + FETCH; // eksekusi menyela parser begitu unduhan selesai
    bars.push(
      { lane: "parse", start: 0, end: f, label: "Parse HTML" },
      { lane: "fetch", start: HEAD, end: f, label: "Unduh script" },
      { lane: "exec", start: f, end: f + EXEC, label: "Jalankan", block: true },
      { lane: "parse", start: f + EXEC, end: HEAD + BODY + EXEC, label: "Parse sisa" },
    );
    parseEnd = dcl = HEAD + BODY + EXEC;
  }
  const paint = Math.max(parseEnd, CSS_FETCH + CSSOM);
  return { bars, parseEnd, dcl, paint, end: Math.max(dcl, paint + 1) + 0.5 };
}

export type NodeState = "idle" | "active" | "blocked" | "done";
export type Node = "dom" | "cssom" | "tree" | "layout" | "paint";

// Keadaan tiap tahap pada waktu t.
export function stateAt(v: Variant, t: number): Record<Node, NodeState> {
  const tl = timeline(v);
  const inBar = (l: Lane) => tl.bars.some((b) => b.lane === l && t >= b.start && t < b.end);
  const blocked = tl.bars.some((b) => b.block && t >= b.start && t < b.end);
  const cssEnd = CSS_FETCH + CSSOM;
  const stage = (i: number): NodeState => {
    const a = tl.paint + i / 3, b = a + 1 / 3;
    return t >= b ? "done" : t >= a ? "active" : "idle";
  };
  return {
    dom: t >= tl.parseEnd ? "done" : blocked ? "blocked" : inBar("parse") ? "active" : "idle",
    cssom: t >= cssEnd ? "done" : inBar("css") ? "active" : "idle",
    tree: stage(0), layout: stage(1), paint: stage(2),
  };
}
