export const CAP = 6;
export type SQ = { stack: string[]; queue: string[] };
export type Result = { state: SQ; ok: boolean; text: string; out?: { stack: string; queue: string } };

export const add = (s: SQ, v: string, cap = CAP): Result =>
  s.stack.length >= cap
    ? { state: s, ok: false, text: `Penuh: sudah ${cap} item. Stack dan queue menolak ${v} (overflow).` }
    : { state: { stack: [...s.stack, v], queue: [...s.queue, v] }, ok: true, text: `${v} masuk: push ke puncak stack, enqueue ke belakang queue.` };

export const remove = (s: SQ): Result => {
  if (!s.stack.length) return { state: s, ok: false, text: "Kosong: tidak ada yang bisa dikeluarkan. Di Python, pop() pada list kosong melempar IndexError." };
  const stack = s.stack.slice(0, -1);
  const queue = s.queue.slice(1);
  const a = s.stack[s.stack.length - 1];
  const b = s.queue[0];
  return { state: { stack, queue }, ok: true, out: { stack: a, queue: b }, text: a === b ? `Hanya satu item: ${a} keluar dari keduanya.` : `pop mengeluarkan ${a} (terakhir masuk), dequeue mengeluarkan ${b} (pertama masuk).` };
};
