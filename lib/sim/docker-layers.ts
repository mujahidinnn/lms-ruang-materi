// Docker layer cache model: a layer is rebuilt when its inputs changed or any layer above it was rebuilt.
export type Change = "none" | "src" | "pkg";
export type Dep = "src" | "pkg";
export type Layer = { cmd: string; deps: Dep[]; sec: number; note: string };
export type Row = Layer & { rebuilt: boolean; sec: number };

export const GOOD: Layer[] = [
  { cmd: "FROM node:20-alpine", deps: [], sec: 0.5, note: "image dasar" },
  { cmd: "WORKDIR /app", deps: [], sec: 0.1, note: "folder kerja" },
  { cmd: "COPY package*.json ./", deps: ["pkg"], sec: 0.2, note: "hanya berkas dependency" },
  { cmd: "RUN npm ci", deps: ["pkg"], sec: 45, note: "unduh dependency" },
  { cmd: "COPY . .", deps: ["src", "pkg"], sec: 1, note: "seluruh kode" },
  { cmd: "CMD [\"node\", \"server.js\"]", deps: [], sec: 0.1, note: "perintah awal" },
];

// Same Dockerfile with COPY . . moved above npm ci.
export const BAD: Layer[] = [
  GOOD[0]!,
  GOOD[1]!,
  { cmd: "COPY . .", deps: ["src", "pkg"], sec: 1, note: "seluruh kode" },
  { cmd: "RUN npm ci", deps: ["src", "pkg"], sec: 45, note: "unduh dependency" },
  GOOD[5]!,
];

export function plan(layers: Layer[], change: Change): Row[] {
  let cascade = false;
  return layers.map((l) => {
    if (change !== "none" && l.deps.includes(change)) cascade = true;
    return { ...l, rebuilt: cascade, sec: cascade ? l.sec : 0 };
  });
}

export const total = (rows: Row[]) => Math.round(rows.reduce((a, r) => a + r.sec, 0) * 10) / 10;
