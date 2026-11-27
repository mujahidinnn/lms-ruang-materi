import { expect, test } from "vitest";
import { runChecksPhp } from "./check-php.ts";

test("php checks pass only on exactly true and report the error type", async () => {
  const tests = [{ name: "ok", check: "f(2) === 4" }, { name: "truthy", check: "f(1)" }, { name: "err", check: "g()" }, { name: "var", check: "$x === 'a'" }, { name: "mb", check: "mb_strlen('é') === 1" }];
  const r = await runChecksPhp({ code: "<?php\n$x = 'a';\nfunction f($n) { echo $n; return $n * 2; }", setup: "", tests });
  expect(r.results).toEqual([{ name: "ok", pass: true }, { name: "truthy", pass: false }, { name: "err", pass: false, error: "Error: Call to undefined function g()" }, { name: "var", pass: true }, { name: "mb", pass: true }]);
  expect((await runChecksPhp({ code: "function (", setup: "", tests })).error).toMatch(/^ParseError:/);
  expect((await runChecksPhp({ code: "exit;", setup: "", tests })).error).toMatch(/exit\/die/);
  const strict = "<?php\ndeclare(strict_types=1);\nfunction h(int $n) { return $n; }\ntry { h(\"1\"); $kena = false; } catch (TypeError) { $kena = true; }";
  expect((await runChecksPhp({ code: strict, setup: "", tests: [{ name: "s", check: "$kena === true" }] })).results).toEqual([{ name: "s", pass: true }]);
  expect((await runChecksPhp({ code: "new FFI();", setup: "", tests })).error).toMatch(/FFI/);
  expect((await runChecksPhp({ code: "shell_exec('id');", setup: "", tests })).error).toMatch(/undefined function shell_exec/);
  expect((await runChecksPhp({ code: "file_get_contents('/etc/passwd');", setup: "", tests: [{ name: "x", check: "true" }] })).results).toEqual([{ name: "x", pass: true }]);
});
