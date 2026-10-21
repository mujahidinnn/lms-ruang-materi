import { expect, test } from "vitest";
import { runChecksPython } from "./check-python.ts";

test("python checks pass only on exactly True and report the error type", async () => {
  const r = await runChecksPython({ code: "def f(x):\n    print(x)\n    return x * 2", setup: "", tests: [{ name: "ok", check: "f(2) == 4" }, { name: "truthy", check: "f(1)" }, { name: "err", check: "g()" }] });
  expect(r.results).toEqual([{ name: "ok", pass: true }, { name: "truthy", pass: false }, { name: "err", pass: false, error: "NameError: name 'g' is not defined" }]);
  expect((await runChecksPython({ code: "input()", setup: "", tests: [] })).error).toMatch(/^RuntimeError: input\(\)/);
});
