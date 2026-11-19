export type Mode = "none" | "named" | "bind";
export type State = { mode: Mode; alive: boolean; layer: number; store: number; lost: number };

export const MODES: { id: Mode; label: string }[] = [
  { id: "none", label: "Tanpa volume" },
  { id: "named", label: "Named volume" },
  { id: "bind", label: "Bind mount" },
];

export const start = (mode: Mode): State => ({ mode, alive: true, layer: 0, store: 0, lost: 0 });

export const write = (s: State): State =>
  !s.alive ? s : s.mode === "none" ? { ...s, layer: s.layer + 1 } : { ...s, store: s.store + 1 };

export const remove = (s: State): State =>
  s.alive ? { ...s, alive: false, lost: s.lost + s.layer, layer: 0 } : s;

export const recreate = (s: State): State => (s.alive ? s : { ...s, alive: true });

// Rows visible to the database inside the running container.
export const records = (s: State) => (!s.alive ? 0 : s.mode === "none" ? s.layer : s.store);

export const verdict = (s: State): "hilang" | "aman" | "kosong" =>
  s.lost > 0 && s.mode === "none" && records(s) === 0 ? "hilang" : s.mode !== "none" && s.store > 0 ? "aman" : "kosong";

export const command = (m: Mode) =>
  ["docker run -d --name db", "  -e POSTGRES_PASSWORD=rahasia"]
    .concat(m === "named" ? ["  -v pgdata:/var/lib/postgresql/data"] : m === "bind" ? ['  -v "$(pwd)/data":/var/lib/postgresql/data'] : [])
    .concat("  postgres:17-alpine")
    .join(" \\\n");

export const location = (m: Mode) =>
  m === "none" ? "writable layer container (hilang bersama container)"
    : m === "named" ? "/var/lib/docker/volumes/pgdata/_data"
    : "./data di host (bisa dibuka langsung)";
