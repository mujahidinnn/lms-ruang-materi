// Service membagi request ke Pod siap; Deployment mengganti Pod yang mati. Murni, tanpa DOM.
export type Pod = { id: number; status: "siap" | "mulai" | "mati"; hits: number };
export type State = { pods: Pod[]; replicas: number; nextId: number; sent: number; gagal: number; last: number | null };

export const awal = (replicas: number): State => ({
  pods: Array.from({ length: replicas }, (_, i) => ({ id: i + 1, status: "siap", hits: 0 })),
  replicas, nextId: replicas + 1, sent: 0, gagal: 0, last: null,
});

export const nama = (id: number) => `web-${((id * 2654435761) >>> 0).toString(36).slice(0, 5)}`;
export const endpoints = (s: State) => s.pods.filter((p) => p.status === "siap");

// round-robin atas endpoint; tanpa endpoint request gagal
export function kirim(s: State): State {
  const ep = endpoints(s);
  if (!ep.length) return { ...s, sent: s.sent + 1, gagal: s.gagal + 1, last: null };
  const t = ep[s.sent % ep.length];
  return { ...s, sent: s.sent + 1, last: t.id, pods: s.pods.map((p) => (p.id === t.id ? { ...p, hits: p.hits + 1 } : p)) };
}

export const matikan = (s: State, id: number): State => ({ ...s, pods: s.pods.map((p) => (p.id === id && p.status === "siap" ? { ...p, status: "mati" } : p)) });

// satu putaran reconciliation: Pod baru jadi siap, Pod mati dibuang dan digantikan
export function tick(s: State): State {
  let pods = s.pods.map((p) => (p.status === "mulai" ? { ...p, status: "siap" as const } : p));
  let nextId = s.nextId;
  const mati = pods.filter((p) => p.status === "mati").length;
  pods = pods.filter((p) => p.status !== "mati");
  for (let i = 0; i < mati; i++) pods.push({ id: nextId++, status: "mulai", hits: 0 });
  while (pods.length < s.replicas) pods.push({ id: nextId++, status: "mulai", hits: 0 });
  return { ...s, pods, nextId };
}

export const perluTick = (s: State) => s.pods.some((p) => p.status !== "siap");
