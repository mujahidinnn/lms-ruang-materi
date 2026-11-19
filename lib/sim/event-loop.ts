// Program mini: hanya log, setTimeout, dan microtask. Tidak mengevaluasi JS sungguhan.
export type Op =
  | { t: "log"; text: string; line: number }
  | { t: "timeout"; ms: number; task: Task; line: number }
  | { t: "micro"; task: Task; line: number };
export type Task = { label: string; body: Op[]; next?: Task; line: number };

export type Step = { stack: string[]; micro: string[]; macro: string[]; out: string[]; note: string; line: number };

type Q = { task: Task; due: number; seq: number };

const opLabel = (o: Op) => (o.t === "log" ? `log("${o.text}")` : o.t === "timeout" ? `setTimeout(${o.ms})` : "queueMicrotask");

// Menghitung semua langkah di awal; UI tinggal maju/mundur.
export function run(program: Op[]): Step[] {
  const steps: Step[] = [];
  const micro: Q[] = [], macro: Q[] = [];
  const out: string[] = [];
  let clock = 0, seq = 0;
  const snap = (stack: string[], note: string, line: number) =>
    steps.push({ stack, micro: micro.map((q) => q.task.label), macro: macro.map((q) => q.task.label), out: [...out], note, line });

  const exec = (base: string[], body: Op[]) => {
    for (const o of body) {
      snap([...base, opLabel(o)], o.t === "log" ? `Dijalankan di call stack: tercetak "${o.text}".` : o.t === "timeout" ? `Timer dititipkan ke Web API. Setelah ${o.ms} ms, callback masuk task queue.` : "Microtask didaftarkan; menunggu stack kosong.", o.line);
      if (o.t === "log") out.push(o.text);
      else if (o.t === "timeout") macro.push({ task: o.task, due: clock + o.ms, seq: seq++ });
      else micro.push({ task: o.task, due: 0, seq: seq++ });
    }
  };

  snap(["main()"], "Program mulai: seluruh kode sinkron berjalan di call stack lebih dulu.", program[0]?.line ?? 0);
  exec(["main()"], program);
  snap([], "Kode sinkron selesai, stack kosong. Event loop memeriksa microtask queue dulu.", 0);

  for (;;) {
    let q: Q | undefined, kind: string;
    if (micro.length) { q = micro.shift(); kind = "microtask"; }
    else if (macro.length) {
      macro.sort((a, b) => a.due - b.due || a.seq - b.seq);
      q = macro.shift(); kind = "task"; clock = q!.due;
    } else break;
    let t: Task | undefined = q!.task;
    snap([t.label], `Event loop memindahkan ${kind} ke call stack.`, t.line);
    exec([t.label], t.body);
    if (t.next) micro.push({ task: t.next, due: 0, seq: seq++ });
    snap([], micro.length ? "Stack kosong. Microtask yang tersisa dijalankan sebelum task berikutnya." : macro.length ? "Microtask queue kosong. Event loop mengambil task berikutnya." : "Semua antrean kosong.", 0);
    t = undefined;
  }
  return steps;
}

const log = (text: string, line: number): Op => ({ t: "log", text, line });
const cb = (label: string, body: Op[], line: number, next?: Task): Task => ({ label, body, line, next });

export type Preset = { name: string; code: string[]; program: Op[] };

export const PRESETS: Preset[] = [
  {
    name: "setTimeout 0",
    code: ['console.log("A");', 'setTimeout(() => console.log("B"), 0);', 'console.log("C");'],
    program: [log("A", 0), { t: "timeout", ms: 0, line: 1, task: cb("timer cb", [log("B", 1)], 1) }, log("C", 2)],
  },
  {
    name: "Promise vs timer",
    code: ['console.log("1");', 'setTimeout(() => console.log("2"), 0);', "Promise.resolve().then(() => console.log(\"3\"));", 'console.log("4");'],
    program: [
      log("1", 0),
      { t: "timeout", ms: 0, line: 1, task: cb("timer cb", [log("2", 1)], 1) },
      { t: "micro", line: 2, task: cb("then cb", [log("3", 2)], 2) },
      log("4", 3),
    ],
  },
  {
    name: "Rantai then",
    code: ['setTimeout(() => console.log("timer"), 0);', "Promise.resolve()", "  .then(() => {", '    console.log("then 1");', '    queueMicrotask(() => console.log("mikro"));', "  })", '  .then(() => console.log("then 2"));', 'console.log("sinkron");'],
    program: [
      { t: "timeout", ms: 0, line: 0, task: cb("timer cb", [log("timer", 0)], 0) },
      { t: "micro", line: 2, task: cb("then 1", [log("then 1", 3), { t: "micro", line: 4, task: cb("mikro cb", [log("mikro", 4)], 4) }], 2, cb("then 2", [log("then 2", 6)], 6)) },
      log("sinkron", 7),
    ],
  },
];
