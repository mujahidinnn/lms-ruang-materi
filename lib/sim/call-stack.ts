export type Frame = { id: number; label: string; note: string; base: boolean; ret: number | null };
export type CStep = { stack: Frame[]; kind: "call" | "base" | "return" | "done"; text: string };
export type Fn = "faktorial" | "fibonacci";

export function trace(fn: Fn, n: number): CStep[] {
  const steps: CStep[] = [];
  const stack: Frame[] = [];
  let id = 0;
  const emit = (kind: CStep["kind"], text: string) => steps.push({ kind, text, stack: stack.map((f) => ({ ...f })) });
  const name = fn === "faktorial" ? "faktorial" : "fib";

  function run(k: number): number {
    const f: Frame = { id: id++, label: `${name}(${k})`, note: "", base: false, ret: null };
    stack.push(f);
    if (k <= 1) {
      f.base = true;
      f.ret = fn === "faktorial" ? 1 : k;
      f.note = `kasus dasar: n ≤ 1`;
      emit("base", `Panggil ${f.label}: n ≤ 1, ini kasus dasar. Langsung mengembalikan ${f.ret}.`);
      stack.pop();
      return f.ret;
    }
    f.note = fn === "faktorial" ? `menunggu ${k} × faktorial(${k - 1})` : `menunggu fib(${k - 1}) + fib(${k - 2})`;
    emit("call", `Panggil ${f.label}: belum kasus dasar, frame baru masuk ke stack.`);
    let res: number;
    if (fn === "faktorial") {
      const a = run(k - 1);
      res = k * a;
      f.note = `${k} × ${a}`;
      f.ret = res;
      emit("return", `faktorial(${k - 1}) kembali dengan ${a}. Maka ${f.label} = ${k} × ${a} = ${res}.`);
    } else {
      const a = run(k - 1);
      f.note = `${a} + menunggu fib(${k - 2})`;
      emit("call", `fib(${k - 1}) kembali dengan ${a}. ${f.label} sekarang memanggil fib(${k - 2}).`);
      const b = run(k - 2);
      res = a + b;
      f.note = `${a} + ${b}`;
      f.ret = res;
      emit("return", `fib(${k - 2}) kembali dengan ${b}. Maka ${f.label} = ${a} + ${b} = ${res}.`);
    }
    stack.pop();
    return res;
  }

  const out = run(n);
  emit("done", `Stack kosong. ${name}(${n}) = ${out}.`);
  return steps;
}
