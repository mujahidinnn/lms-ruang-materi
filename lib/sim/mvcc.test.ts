import { expect, test } from "vitest";
import { type Iso, type Sim, type Who, act, initial } from "./mvcc";

const last = (m: Sim, w: Who) => m.s[w].log.at(-1)!;
const run = (iso: Iso, steps: [Who, Parameters<typeof act>[2]][]) => steps.reduce((m, [w, c]) => act(m, w, c), initial(iso));
const setup: [Who, "BEGIN" | "SELECT" | "UPDATE" | "COMMIT"][] = [["A", "BEGIN"], ["A", "SELECT"], ["B", "BEGIN"], ["B", "UPDATE"]];

test("no dirty read, and commit visibility differs by isolation", () => {
  const dirty = run("READ COMMITTED", [...setup, ["A", "SELECT"]]);
  expect(last(dirty, "A").out).toBe("saldo = 100");
  expect(last(run("READ COMMITTED", [...setup, ["B", "COMMIT"], ["A", "SELECT"]]), "A").out).toBe("saldo = 110");
  expect(last(run("REPEATABLE READ", [...setup, ["B", "COMMIT"], ["A", "SELECT"]]), "A").out).toBe("saldo = 100");
});

test("writer waits for row lock; rollback leaves a dead version", () => {
  let m = run("READ COMMITTED", [["A", "BEGIN"], ["A", "UPDATE"], ["B", "BEGIN"], ["B", "UPDATE"]]);
  expect(last(m, "B").kind).toBe("wait");
  m = act(act(m, "A", "ROLLBACK"), "B", "SELECT");
  expect(last(m, "B").out).toBe("saldo = 100");
  expect(m.versions).toHaveLength(2);
  expect(m.status[m.versions[1].xmin]).toBe("aborted");
});

test("repeatable read refuses to update a row changed after its snapshot", () => {
  const m = run("REPEATABLE READ", [...setup, ["B", "COMMIT"], ["A", "UPDATE"]]);
  expect(last(m, "A").out).toMatch(/could not serialize/);
  const rc = run("READ COMMITTED", [...setup, ["B", "COMMIT"], ["A", "UPDATE"]]);
  expect(last(rc, "A").out).toBe("UPDATE 1");
  expect(rc.versions.at(-1)!.saldo).toBe(120);
});
