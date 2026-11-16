import { expect, test } from "vitest";
import { runChecksNode } from "./check-node";
import { buildSandboxDoc } from "./sandbox-doc";

const alamat = { name: "alamat", check: 'router.addresses.length === 1 && router.addresses[0].network === "192.168.88.0"' };
const run = (code: string, tests = [alamat], setup = "") => runChecksNode({ kind: "mikrotik", setup, code, tests });

test("a correct script passes, an empty one fails the same check", async () => {
  expect((await run("/ip address add address=192.168.88.1/24 interface=ether2")).results[0].pass).toBe(true);
  expect((await run("")).results[0].pass).toBe(false);
});

test("setup can define awal", async () => {
  const r = await run("", [{ name: "id", check: 'router.identity === "R9"' }], 'var awal = { identity: "R9" };');
  expect(r.results[0].pass).toBe(true);
});

test("keluaran carries the command echo", async () => {
  const r = await run("/ip address print", [{ name: "echo", check: 'keluaran.join("\\n").includes("/ip address print")' }]);
  expect(r.results[0].pass).toBe(true);
});

test("script text is data, never code", async () => {
  const script = "`${process.exit()}`\n</script>\n\"; while(true){}; \"";
  const r = await run(script, [{ name: "galat", check: 'keluaran.some((l) => l.includes("bad command name"))' }]);
  expect(r.error).toBeUndefined();
  expect(r.results[0].pass).toBe(true);
});

test("the shim source embedded by buildSandboxDoc evaluates", () => {
  const doc = buildSandboxDoc({ kind: "mikrotik", files: { code: "</script>" }, setup: "", tests: [], nonce: "n" });
  expect(doc).toContain("jalankanRouterOS");
  expect(doc).not.toContain("loadPyodide");
  expect(doc.match(/<\/script>/gi)).toHaveLength(1);
  // Extract the payload the worker evaluates and run its shim as the sandbox does.
  const m = doc.match(/new Blob\(\[("(?:[^"\\]|\\.)*")\]/)!;
  const worker: string = JSON.parse(m[1]);
  const payload = JSON.parse(worker.match(/\)\((\{.*\}), \(src\)/s)![1]);
  const g: Record<string, unknown> = {};
  new Function("globalThis", `Object.assign(globalThis, (${payload.shim})());`)(g);
  const out = (g.jalankanRouterOS as (s: string) => { router: { identity: string } })("/system identity set name=X");
  expect(out.router.identity).toBe("X");
  expect(payload.code).toContain("jalankanRouterOS");
});
