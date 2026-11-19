// Versions of each file in the four areas. Their changes sit in "theirs" until pulled.
export type F = { w: number; s: number; r: number; o: number; t: boolean; b: number };
export type Areas = { files: Record<string, F>; seq: number; cmd: string; note: string; err: boolean };
export const FILES = ["index.html", "style.css", "app.js"];

export function initAreas(): Areas {
  const files: Record<string, F> = {};
  for (const n of FILES) files[n] = { w: 1, s: 1, r: 1, o: 1, t: false, b: 1 };
  return { files, seq: 1, cmd: "git clone", note: "Repositori baru dikloning: keempat area berisi versi yang sama.", err: false };
}

const f = (a: Areas, n: string) => a.files[n] as F;
const set = (a: Areas, n: string, p: Partial<F>, rest: Partial<Areas>): Areas => ({ ...a, ...rest, files: { ...a.files, [n]: { ...f(a, n), ...p } } });
const all = (a: Areas) => FILES.map((n) => [n, f(a, n)] as const);

export const modified = (x: F) => x.w !== x.s;
export const staged = (x: F) => x.s !== x.r;
export const ahead = (x: F) => x.r !== x.o && !(x.t && x.r === x.b);

export const canAdd = (a: Areas, n: string) => modified(f(a, n));
export const canUnstage = (a: Areas, n: string) => staged(f(a, n));
export const canCommit = (a: Areas) => all(a).some(([, x]) => staged(x));
export const canPush = (a: Areas) => all(a).some(([, x]) => ahead(x));
export const canPull = (a: Areas) => all(a).some(([, x]) => x.t);
export const canTeammate = (a: Areas) => !canPull(a) && all(a).some(([, x]) => x.w === x.s && x.s === x.r && x.r === x.o);

export function edit(a: Areas, n: string): Areas {
  return set(a, n, { w: a.seq + 1 }, { seq: a.seq + 1, cmd: `# edit ${n}`, note: `${n} diubah di working directory. Git melihatnya sebagai modified, belum masuk staging.`, err: false });
}
export function add(a: Areas, n: string): Areas {
  return set(a, n, { s: f(a, n).w }, { cmd: `git add ${n}`, note: `Isi ${n} saat ini disalin ke staging area. Edit setelah ini belum ikut.`, err: false });
}
export function unstage(a: Areas, n: string): Areas {
  return set(a, n, { s: f(a, n).r }, { cmd: `git restore --staged ${n}`, note: `${n} dikeluarkan dari staging. Isi di working directory tidak berubah.`, err: false });
}
export function commit(a: Areas): Areas {
  const files = { ...a.files };
  const names: string[] = [];
  for (const [n, x] of all(a)) if (staged(x)) { files[n] = { ...x, r: x.s }; names.push(n); }
  return { ...a, files, cmd: 'git commit -m "pesan"', note: `Isi staging (${names.join(", ")}) disegel jadi commit di local repository.`, err: false };
}
export function push(a: Areas): Areas {
  if (canPull(a)) return { ...a, cmd: "git push", note: "! [rejected] remote punya commit yang belum kamu miliki. Jalankan git pull dulu.", err: true };
  const files = { ...a.files };
  for (const [n, x] of all(a)) files[n] = { ...x, o: x.r };
  return { ...a, files, cmd: "git push", note: "Commit di local repository dikirim ke remote.", err: false };
}
export function pull(a: Areas): Areas {
  const bad = all(a).find(([, x]) => x.t && (modified(x) || staged(x)));
  if (bad) return { ...a, cmd: "git pull", note: `error: perubahan lokal pada ${bad[0]} akan tertimpa. Commit atau restore dulu.`, err: true };
  const files = { ...a.files };
  let seq = a.seq, merged = false;
  for (const [n, x] of all(a)) {
    if (!x.t) continue;
    if (x.r !== x.b) { seq++; merged = true; files[n] = { ...x, w: seq, s: seq, r: seq, t: false, b: seq }; }
    else files[n] = { ...x, w: x.o, s: x.o, r: x.o, t: false, b: x.o };
  }
  return { ...a, files, seq, cmd: "git pull", note: merged ? "Commit remote digabung dengan commit lokalmu (merge commit), lalu semua area ikut diperbarui." : "Commit baru dari remote diambil ke local repository dan working directory.", err: false };
}
export function teammate(a: Areas): Areas {
  const hit = all(a).find(([, x]) => x.w === x.s && x.s === x.r && x.r === x.o);
  if (!hit) return a;
  return set(a, hit[0], { o: a.seq + 1, t: true, b: hit[1].r }, { seq: a.seq + 1, cmd: "# rekan: git push", note: `Rekan setimmu mengubah ${hit[0]} dan mem-push-nya. Remote kini lebih maju dari laptopmu.`, err: false });
}
