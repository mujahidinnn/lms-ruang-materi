import { expect, test } from "vitest";
import { run } from "./pipe-redirect";

const screen = (s: string) => run(s).stages.flatMap((x) => x.toScreen);
const last = (s: string) => run(s).stages.at(-1)!;

test("grep | sort | uniq -c", () => {
  expect(screen("cat log.txt | grep ERROR | sort | uniq -c")).toEqual(["      2 ERROR auth failed", "      3 ERROR db timeout"]);
});

test("ls > file includes the new file itself and nothing on screen", () => {
  const r = last("ls > daftar.txt");
  expect(r.files["daftar.txt"]).toEqual(["catatan.txt", "daftar.txt", "log.txt"]);
  expect(r.toScreen).toEqual([]);
});

test(">> appends, > overwrites", () => {
  expect(last("echo selesai >> catatan.txt").files["catatan.txt"]).toEqual(["beli kopi", "baca bab pipe", "selesai"]);
  expect(last("echo baru > catatan.txt").files["catatan.txt"]).toEqual(["baru"]);
});

test("stderr bypasses the pipe", () => {
  const r = run("cat log.txt hilang.txt | wc -l").stages;
  expect(r[0]!.toScreen).toEqual(["cat: hilang.txt: No such file or directory"]);
  expect(r[1]!.toScreen).toEqual(["9"]);
});

test("2> sends only the error to a file", () => {
  const r = last("cat hilang.txt 2> galat.txt");
  expect(r.files["galat.txt"]).toEqual(["cat: hilang.txt: No such file or directory"]);
  expect(r.toScreen).toEqual([]);
});

test("2>&1 | tee merges stderr into pipe", () => {
  const r = run("cat log.txt hilang.txt 2>&1 | tee semua.txt | wc -l").stages;
  expect(r[1]!.files["semua.txt"]).toHaveLength(10);
  expect(r[2]!.toScreen).toEqual(["10"]);
});

test("order matters: 2>&1 > f leaves error on screen", () => {
  const r = last("cat log.txt hilang.txt 2>&1 > semua.txt");
  expect(r.toScreen).toEqual(["cat: hilang.txt: No such file or directory"]);
  expect(r.files["semua.txt"]).toHaveLength(9);
});

test("head, sort -rn, unknown command", () => {
  expect(screen("cat log.txt | head -n 2")).toEqual(["INFO ok", "ERROR db timeout"]);
  expect(screen("echo a | cat")).toEqual(["a"]);
  expect(screen("zzz")).toEqual(["zzz: command not found"]);
  expect(run("a | | b").error).toBeTruthy();
});
