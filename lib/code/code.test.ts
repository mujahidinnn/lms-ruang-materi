import { expect, test } from "vitest";
import { runChecksNode } from "./check-node";
import { expressShim } from "./express-shim";

test("shim routes params, query and json bodies", async () => {
  const { require, request } = expressShim();
  const express = require("express");
  const app = express();
  app.use(express.json());
  app.get("/produk/:id", (req, res) => res.json({ id: req.params.id, q: req.query.q }));
  app.post("/produk", (req, res) => res.status(201).json(req.body));
  expect(await request("GET", "/produk/7?q=a")).toEqual({ status: 200, body: { id: "7", q: "a" } });
  expect(await request("POST", "/produk", { nama: "x" })).toEqual({ status: 201, body: { nama: "x" } });
  expect((await request("GET", "/tidak-ada")).status).toBe(404);
});

test("runChecksNode passes a right solution and fails a wrong one", async () => {
  const tests = [{ name: "2+3", check: "jumlah(2, 3) === 5" }];
  const ok = await runChecksNode({ kind: "js", code: "function jumlah(a, b) { return a + b }", setup: "", tests });
  expect(ok.results).toEqual([{ name: "2+3", pass: true }]);
  const bad = await runChecksNode({ kind: "js", code: "function jumlah(a, b) { return a - b }", setup: "", tests });
  expect(bad.results[0].pass).toBe(false);
});

test("a throwing check is a failed check with its error", async () => {
  const r = await runChecksNode({ kind: "js", code: "", setup: "", tests: [{ name: "x", check: "tidakAda() === 1" }] });
  expect(r.results[0]).toMatchObject({ name: "x", pass: false });
  expect(r.results[0].error).toMatch(/tidakAda/);
});

test("express checks can await request()", async () => {
  const code = "const express = require('express'); const app = express(); app.get('/halo', (req, res) => res.send('hai')); app.listen(3000);";
  const r = await runChecksNode({ kind: "express", code, setup: "", tests: [{ name: "GET /halo", check: "(await request('GET', '/halo')).body === 'hai'" }] });
  expect(r.results[0].pass).toBe(true);
});

test("an infinite loop is stopped", async () => {
  const r = await runChecksNode({ kind: "js", code: "while (true) {}", setup: "", tests: [] });
  expect(r.error).toMatch(/terlalu lama/);
});

test("drafted code cannot reach the worker's process, env or files", async () => {
  process.env.RAHASIA_UJI = "bocor";
  const tests = [
    { name: "escape", check: "this.constructor.constructor('return process')().env.RAHASIA_UJI === 'bocor'" },
    { name: "fs", check: "!!this.constructor.constructor('return process')().mainModule.require('fs').readFileSync('/etc/hostname')" },
  ];
  const r = await runChecksNode({ kind: "js", code: "", setup: "", tests });
  expect(r.results.map((x) => x.pass)).toEqual([false, false]);
});
