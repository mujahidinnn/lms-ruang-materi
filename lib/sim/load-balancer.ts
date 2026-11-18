// Server choice for the load balancer simulation (components/belajar/sim).
export type Algo = "round-robin" | "least-connections";
export type Backend = { up: boolean; active: number };

// Index of the server that takes the next request, or -1 when none is up.
// `turn` counts requests so far (round robin walks from it, skipping down servers).
export function pick(algo: Algo, servers: Backend[], turn: number): number {
  const up = servers.flatMap((s, i) => (s.up ? [i] : []));
  if (!up.length) return -1;
  if (algo === "least-connections") return up.reduce((a, b) => (servers[b].active < servers[a].active ? b : a));
  for (let k = 0; k < servers.length; k++) {
    const i = (turn + k) % servers.length;
    if (servers[i].up) return i;
  }
  return -1;
}
