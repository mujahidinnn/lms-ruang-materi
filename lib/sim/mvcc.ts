// One-row MVCC model: versions carry xmin (creator) and xmax (deleter/updater) like Postgres.
export type Iso = "READ COMMITTED" | "REPEATABLE READ";
export type Who = "A" | "B";
export type Cmd = "BEGIN" | "UPDATE" | "SELECT" | "COMMIT" | "ROLLBACK";
export type Version = { saldo: number; xmin: number; xmax: number | null };
export type Line = { sql: string; out: string; kind: "ok" | "err" | "wait" };
export type Sess = { tx: number | null; snap: number[] | null; log: Line[] };
export type Sim = { iso: Iso; next: number; status: Record<number, "active" | "committed" | "aborted">; versions: Version[]; s: Record<Who, Sess> };

export const initial = (iso: Iso): Sim => ({
  iso, next: 100, status: { 1: "committed" }, versions: [{ saldo: 100, xmin: 1, xmax: null }],
  s: { A: { tx: null, snap: null, log: [] }, B: { tx: null, snap: null, log: [] } },
});

const committed = (m: Sim) => Object.keys(m.status).map(Number).filter((id) => m.status[id] === "committed");

export function visible(m: Sim, me: number | null, snap: number[]): Version | undefined {
  return m.versions.find((v) => (v.xmin === me || snap.includes(v.xmin)) && !(v.xmax !== null && (v.xmax === me || snap.includes(v.xmax))));
}

export function act(prev: Sim, who: Who, cmd: Cmd): Sim {
  const m = structuredClone(prev);
  const s = m.s[who];
  const say = (sql: string, out: string, kind: Line["kind"] = "ok") => { s.log = [...s.log, { sql, out, kind }].slice(-6); return m; };

  if (cmd === "BEGIN") {
    if (s.tx !== null) return say("BEGIN", "WARNING: transaksi sudah berjalan", "err");
    s.tx = m.next++;
    s.snap = null;
    m.status[s.tx] = "active";
    return say(`BEGIN ISOLATION LEVEL ${m.iso}`, `BEGIN (txid ${s.tx})`);
  }
  if (cmd === "COMMIT" || cmd === "ROLLBACK") {
    if (s.tx === null) return say(cmd, "WARNING: tidak ada transaksi berjalan", "err");
    m.status[s.tx] = cmd === "COMMIT" ? "committed" : "aborted";
    s.tx = null;
    s.snap = null;
    return say(cmd, cmd);
  }
  // Snapshot: fresh per statement in READ COMMITTED, fixed at first statement in REPEATABLE READ.
  if (m.iso === "REPEATABLE READ" && s.tx !== null && s.snap === null) s.snap = committed(m);
  const snap = m.iso === "REPEATABLE READ" && s.snap ? s.snap : committed(m);

  if (cmd === "SELECT") {
    const v = visible(m, s.tx, snap);
    return say("SELECT saldo FROM rekening WHERE id = 1;", v ? `saldo = ${v.saldo}` : "(0 baris)");
  }
  // UPDATE
  if (s.tx === null) return say("UPDATE", "Mulai dengan BEGIN dulu", "err");
  const cand = m.versions.filter((v) => m.status[v.xmin] === "committed" || v.xmin === s.tx);
  const head = cand.find((v) => v.xmax === null || m.status[v.xmax] === "aborted");
  const sql = "UPDATE rekening SET saldo = saldo + 10 WHERE id = 1;";
  if (!head) return say(sql, "Menunggu: baris dikunci transaksi lain. COMMIT atau ROLLBACK sesi satunya, lalu coba lagi.", "wait");
  if (head.xmin !== s.tx && !snap.includes(head.xmin))
    return say(sql, "ERROR: could not serialize access due to concurrent update", "err");
  head.xmax = s.tx;
  m.versions.push({ saldo: head.saldo + 10, xmin: s.tx, xmax: null });
  return say(sql, "UPDATE 1");
}
