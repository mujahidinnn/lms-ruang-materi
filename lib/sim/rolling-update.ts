// Rolling update Deployment. Murni, tanpa DOM.
export type Versi = 1 | 2;
export type Pod = { v: Versi; ready: boolean };
export type Cfg = { replicas: number; maxSurge: number; maxUnavailable: number };
export type State = { pods: Pod[]; target: Versi; rusak: boolean };

export const awal = (replicas: number, rusak = false): State => ({
  pods: Array.from({ length: replicas }, () => ({ v: 1, ready: true })),
  target: 2,
  rusak,
});

// maxSurge dan maxUnavailable tidak boleh keduanya 0: rollout tidak bisa maju.
export const valid = (c: Cfg) => c.maxSurge > 0 || c.maxUnavailable > 0;
const siap = (p: Pod[]) => p.filter((x) => x.ready).length;

// Satu putaran reconcile: Pod menunggu jadi siap, Pod lama dimatikan, Pod baru dibuat.
export function langkah(c: Cfg, s: State): State {
  if (!valid(c)) return s;
  const maxTotal = c.replicas + c.maxSurge;
  const minReady = c.replicas - c.maxUnavailable;
  let pods = s.pods.map((p) => (!p.ready && p.v === s.target && !(p.v === 2 && s.rusak) ? { ...p, ready: true } : p));
  // pod lama yang belum siap tidak melayani, matikan bebas
  pods = pods.filter((p) => p.v === s.target || p.ready);
  for (;;) {
    const i = pods.findIndex((p) => p.v !== s.target && p.ready);
    if (i < 0 || siap(pods) - 1 < minReady) break;
    pods = pods.filter((_, j) => j !== i);
  }
  const baru = () => pods.filter((p) => p.v === s.target).length;
  while (pods.length < maxTotal && baru() < c.replicas) pods = [...pods, { v: s.target, ready: false }];
  // urutkan: lama dulu, lalu baru, agar tampilan stabil
  pods = [...pods].sort((a, b) => a.v - b.v);
  return { ...s, pods };
}

export const rollback = (s: State): State => ({ ...s, target: s.target === 2 ? 1 : 2 });

export function status(c: Cfg, s: State) {
  const ready = siap(s.pods);
  const selesai = s.pods.length === c.replicas && s.pods.every((p) => p.v === s.target && p.ready);
  const sama = JSON.stringify(langkah(c, s).pods) === JSON.stringify(s.pods);
  return {
    ready,
    total: s.pods.length,
    maxTotal: c.replicas + c.maxSurge,
    minReady: c.replicas - c.maxUnavailable,
    selesai,
    macet: !selesai && valid(c) && sama,
    mati: ready === 0,
    turun: ready < c.replicas,
  };
}
