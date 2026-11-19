export type Kind = "for" | "sum" | "while";
export type LStep = { line: number; vars: [string, string][]; iter: number; out: string; note: string; stopped: boolean };
export const CAP = 12;

export function code(kind: Kind, noInc: boolean): string[] {
  if (kind === "for") return ["for i in range(1, 6):", '    print(i, end=" ")'];
  if (kind === "sum") return ["total = 0", "for i in range(1, 6):", "    total += i", 'print("Total:", total)'];
  return ["hitung = 3", "while hitung > 0:", '    print("Hitung:", hitung)', ...(noInc ? [] : ["    hitung -= 1"]), 'print("Mulai!")'];
}

export function trace(kind: Kind, noInc = false): LStep[] {
  const steps: LStep[] = [];
  let out = "";
  let iter = 0;
  const add = (line: number, vars: [string, string][], note: string, stopped = false) =>
    steps.push({ line, vars, iter, out, note, stopped });
  if (kind === "for") {
    for (let i = 1; i <= 5; i++) {
      iter = i;
      add(0, [["i", `${i}`]], `Putaran ${i}: i diisi ${i} dari range(1, 6).`);
      out += `${i} `;
      add(1, [["i", `${i}`]], `print(${i}) menambah ${i} ke output.`);
    }
    add(0, [["i", "5"]], "range(1, 6) sudah habis (6 tidak ikut), loop selesai.");
    return steps;
  }
  if (kind === "sum") {
    let total = 0;
    add(0, [["total", "0"]], "Akumulator dibuat sebelum loop, nilai awal 0.");
    for (let i = 1; i <= 5; i++) {
      iter = i;
      add(1, [["i", `${i}`], ["total", `${total}`]], `Putaran ${i}: i diisi ${i}.`);
      const before = total;
      total += i;
      add(2, [["i", `${i}`], ["total", `${total}`]], `total += ${i}: ${before} + ${i} = ${total}.`);
    }
    add(1, [["i", "5"], ["total", `${total}`]], "range habis, loop selesai.");
    out = `Total: ${total}`;
    add(3, [["i", "5"], ["total", `${total}`]], `print menampilkan total akhir: ${total}.`);
    return steps;
  }
  let h = 3;
  const v = (): [string, string][] => [["hitung", `${h}`]];
  const last = noInc ? 3 : 4;
  add(0, v(), "hitung diisi 3.");
  while (true) {
    if (!(h > 0)) {
      add(1, v(), `${h} > 0 bernilai False, loop berhenti.`);
      break;
    }
    if (iter >= CAP) {
      add(1, v(), `Dihentikan simulasi: sudah ${CAP} putaran dan hitung tetap ${h}. Di Python asli ini berjalan selamanya sampai kamu menekan Ctrl + C.`, true);
      return steps;
    }
    iter++;
    add(1, v(), `${h} > 0 bernilai True, masuk putaran ${iter}.`);
    out += `Hitung: ${h}\n`;
    add(2, v(), `print menampilkan ${h}.`);
    if (!noInc) {
      h -= 1;
      add(3, v(), `hitung -= 1, sekarang hitung = ${h}.`);
    }
  }
  out += "Mulai!";
  add(last, v(), "Di luar loop, print dijalankan sekali.");
  return steps;
}
