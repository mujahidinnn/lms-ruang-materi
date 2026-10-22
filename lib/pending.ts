import { rpc } from "@/lib/rpc";
import { createClient } from "@/lib/supabase/client";

// Progress a guest earned, kept in this browser until they sign in. Base.astro
// sends it from the first page that has a session, so signing in from a "Belum
// tersimpan" box never means redoing the work. Code passes go first: a chapter
// completes only once its exercises are recorded. An item the server refuses
// (no consent yet, say) stays for the next try.
export const PENDING_KEY = "ruang-materi:progres-tertunda";

type Code = { rpc: "pass_code_exercise" | "pass_project"; param: "p_exercise" | "p_project"; id: string; code: unknown };
type Practice = { topicId: string; correct: number; total: number };
type Pending = { code: Code[]; chapters: string[]; practice: Practice[] };

function read(): Pending {
  try {
    const p = JSON.parse(localStorage.getItem(PENDING_KEY) ?? "{}");
    return { code: p.code ?? [], chapters: p.chapters ?? [], practice: p.practice ?? [] };
  } catch {
    return { code: [], chapters: [], practice: [] };
  }
}

function write(p: Pending) {
  try {
    if (p.code.length || p.chapters.length || p.practice.length) localStorage.setItem(PENDING_KEY, JSON.stringify(p));
    else localStorage.removeItem(PENDING_KEY);
  } catch {}
}

export function keepCode(item: Code) {
  const p = read();
  write({ ...p, code: [...p.code.filter((c) => c.id !== item.id), item] });
}

export function keepChapter(id: string) {
  const p = read();
  if (!p.chapters.includes(id)) write({ ...p, chapters: [...p.chapters, id] });
}

export function keepPractice(item: Practice) {
  const p = read();
  write({ ...p, practice: [...p.practice, item] });
}

export async function flushPending() {
  const p = read();
  if (!p.code.length && !p.chapters.length && !p.practice.length) return;
  const db = createClient();
  const { data } = await db.auth.getSession();
  if (!data.session) return;
  const left: Pending = { code: [], chapters: [], practice: [] };
  for (const c of p.code) {
    const { error } = await db.rpc(c.rpc, { [c.param]: c.id, p_code: c.code });
    if (error) left.code.push(c);
  }
  for (const id of p.chapters) {
    const { error } = await db.rpc("complete_chapter", { p_chapter: id });
    if (error) left.chapters.push(id);
    // The chapter list on this page, if any, ticks it off.
    else window.dispatchEvent(new CustomEvent("bab-selesai", { detail: id }));
  }
  const simpan = rpc("simpanLatihan");
  for (const s of p.practice) {
    const { saved } = await simpan(s.topicId, s.correct, s.total).catch(() => ({ saved: false }));
    if (!saved) left.practice.push(s);
  }
  write(left);
}
