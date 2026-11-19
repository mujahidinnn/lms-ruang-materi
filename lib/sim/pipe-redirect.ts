// Tiny shell over a fixed in-memory filesystem: cat grep sort uniq wc head tee ls echo + > >> 2> 2>&1 < and pipes.
export type Files = Record<string, string[]>;
export const INITIAL: Files = {
  "log.txt": ["INFO ok", "ERROR db timeout", "WARN disk 80%", "ERROR auth failed", "INFO ok", "ERROR db timeout", "WARN disk 80%", "ERROR db timeout", "ERROR auth failed"],
  "catatan.txt": ["beli kopi", "baca bab pipe"],
};
export const PRESETS = [
  "cat log.txt | grep ERROR | sort | uniq -c",
  "ls > daftar.txt",
  "echo selesai >> catatan.txt",
  "cat log.txt hilang.txt | wc -l",
  "cat hilang.txt 2> galat.txt",
  "cat log.txt hilang.txt 2>&1 | tee semua.txt | wc -l",
  "cat log.txt hilang.txt 2>&1 > semua.txt",
];

type Dest = { t: "next" } | { t: "screen" } | { t: "file"; name: string };
type Ev = { fd: 1 | 2; line: string };
export type Stage = {
  text: string;
  stdin: string[];
  stdinFrom: string; // "keyboard" | "pipe" | file name
  out: string[]; // lines written to stdout (fd 1)
  err: string[]; // lines written to stderr (fd 2)
  outTo: string; // human label of fd 1 destination
  errTo: string;
  toScreen: string[];
  files: Files; // snapshot of all files after this stage
  touched: string[]; // files written by this stage
};
export type Result = { stages: Stage[]; error?: string };

type Tok = { v: string; q: boolean };
function tokenize(s: string): Tok[] {
  const out: Tok[] = [];
  let cur = "", q = false, has = false, quote = "";
  for (const c of s) {
    if (quote) { if (c === quote) quote = ""; else cur += c; }
    else if (c === '"' || c === "'") { quote = c; q = has = true; }
    else if (/\s/.test(c)) { if (has) out.push({ v: cur, q }); cur = ""; q = has = false; }
    else { cur += c; has = true; }
  }
  if (has) out.push({ v: cur, q });
  return out;
}
function splitPipes(s: string): string[] {
  const parts: string[] = [];
  let cur = "", quote = "";
  for (const c of s) {
    if (quote) { if (c === quote) quote = ""; cur += c; }
    else if (c === '"' || c === "'") { quote = c; cur += c; }
    else if (c === "|") { parts.push(cur.trim()); cur = ""; }
    else cur += c;
  }
  parts.push(cur.trim());
  return parts;
}

const fmtCount = (n: number, l: string) => `${String(n).padStart(7)} ${l}`;
const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const num = (s: string) => parseFloat(s) || 0;

type Ctx = { fs: Files; stdin: string[]; stdinFromFile: boolean };

function exec(argv: string[], c: Ctx): { ev: Ev[]; teeFiles?: string[] } {
  const [cmd, ...a] = argv;
  const ev: Ev[] = [];
  const o = (line: string) => ev.push({ fd: 1, line });
  const e = (line: string) => ev.push({ fd: 2, line });
  const flags = a.filter((x) => /^-[a-zA-Z]+$/.test(x));
  const rest = a.filter((x) => !flags.includes(x));
  const has = (f: string) => flags.some((x) => x.includes(f));
  const readFiles = (names: string[], who: string) => {
    const lines: string[] = [];
    for (const n of names) {
      const f = c.fs[n];
      if (!f) e(`${who}: ${n}: No such file or directory`);
      else lines.push(...f);
    }
    return lines;
  };
  const input = (who: string, names: string[]) => (names.length ? readFiles(names, who) : c.stdin);
  switch (cmd) {
    case "cat": for (const l of input("cat", rest)) o(l); break;
    case "echo": o(rest.join(" ")); break;
    case "ls":
      if (rest.length) for (const n of rest) e(`ls: cannot access '${n}': No such file or directory`);
      else for (const n of Object.keys(c.fs).sort(cmp)) o(n);
      break;
    case "grep": {
      const [pat, ...files] = rest;
      if (pat === undefined) { e("grep: missing pattern"); break; }
      const re = has("i") ? pat.toLowerCase() : pat;
      const hit = input("grep", files).filter((l) => (has("i") ? l.toLowerCase() : l).includes(re) !== has("v"));
      if (has("c")) o(String(hit.length)); else hit.forEach(o);
      break;
    }
    case "sort": {
      const l = [...input("sort", rest)].sort(has("n") ? (x, y) => num(x) - num(y) || cmp(x, y) : cmp);
      (has("r") ? l.reverse() : l).forEach(o);
      break;
    }
    case "uniq": {
      const l = input("uniq", rest);
      for (let i = 0; i < l.length;) {
        let j = i;
        while (j < l.length && l[j] === l[i]) j++;
        o(has("c") ? fmtCount(j - i, l[i]!) : l[i]!);
        i = j;
      }
      break;
    }
    case "wc": {
      const l = input("wc", rest);
      if (has("l")) o(String(l.length)); else e("wc: hanya -l yang didukung di simulasi ini");
      break;
    }
    case "head": {
      const k = a.indexOf("-n");
      const n = k >= 0 ? num(a[k + 1] ?? "10") : 10;
      const files = rest.filter((_, i) => !(k >= 0 && a[k + 1] === rest[i] && i === rest.indexOf(a[k + 1]!)));
      input("head", files).slice(0, n).forEach(o);
      break;
    }
    case "tee": {
      for (const l of c.stdin) o(l);
      return { ev, teeFiles: rest };
    }
    default: e(`${cmd}: command not found`);
  }
  return { ev };
}

export function run(line: string, initial: Files = INITIAL): Result {
  const fs: Files = Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, [...v]]));
  const parts = splitPipes(line);
  if (parts.some((p) => !p)) return { stages: [], error: "Ada tahap kosong di sekitar tanda |." };
  const stages: Stage[] = [];
  let pipeIn: string[] | null = null;
  parts.forEach((part, idx) => {
    const last = idx === parts.length - 1;
    const toks = tokenize(part);
    const argv: string[] = [];
    let inFile = "";
    let d1: Dest = last ? { t: "screen" } : { t: "next" };
    let d2: Dest = { t: "screen" };
    const opened: { name: string; append: boolean }[] = [];
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i]!;
      const m = t.q ? null : /^(2>&1|2>>|2>|>>|>|<)(.*)$/.exec(t.v);
      if (!m) { argv.push(t.v); continue; }
      const op = m[1]!;
      if (op === "2>&1") { d2 = d1; continue; }
      const name = m[2] || toks[++i]?.v || "";
      if (op === "<") inFile = name;
      else {
        const d: Dest = { t: "file", name };
        if (op === ">" || op === ">>") d1 = d; else d2 = d;
        opened.push({ name, append: op.endsWith(">>") });
      }
    }
    const touched: string[] = [];
    for (const f of opened) { if (!f.append) fs[f.name] = []; else fs[f.name] ??= []; if (!touched.includes(f.name)) touched.push(f.name); }
    const stdinFrom = inFile || (pipeIn ? "pipe" : "keyboard");
    const stdin = inFile ? fs[inFile] ?? [] : pipeIn ?? [];
    const r = exec(argv, { fs, stdin, stdinFromFile: !!inFile });
    for (const n of r.teeFiles ?? []) { fs[n] = [...stdin]; if (!touched.includes(n)) touched.push(n); }
    const out: string[] = [], err: string[] = [], toScreen: string[] = [];
    let next: string[] = [];
    for (const { fd, line: l } of r.ev) {
      (fd === 1 ? out : err).push(l);
      const d = fd === 1 ? d1 : d2;
      if (d.t === "next") next.push(l);
      else if (d.t === "screen") toScreen.push(l);
      else fs[d.name]!.push(l);
    }
    const label = (d: Dest) => (d.t === "file" ? `berkas ${d.name}` : d.t === "next" ? "pipe ke tahap berikut" : "layar");
    const errTo = d2 === d1 ? `${label(d2)} (lewat 2>&1)` : label(d2);
    stages.push({
      text: part, stdin, stdinFrom, out, err, outTo: label(d1), errTo, toScreen,
      files: Object.fromEntries(Object.entries(fs).map(([k, v]) => [k, [...v]])), touched,
    });
    pipeIn = next;
    next = [];
  });
  return { stages };
}
