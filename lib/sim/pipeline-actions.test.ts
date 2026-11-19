import { expect, test } from "vitest";
import { buildJobs, levels, outcomes, totalTicks, view, yaml } from "./pipeline-actions";

test("level topologis: lint dan tes paralel, build lalu deploy", () => {
  expect(levels(buildJobs(false, true))).toEqual({ lint: 0, tes: 0, build: 1, deploy: 2 });
  expect(totalTicks(buildJobs(false, true))).toBe(9);
});

test("tanpa needs semua job di level 0", () => {
  expect(Object.values(levels(buildJobs(false, false))).every((l) => l === 0)).toBe(true);
});

test("gagal menjalar sebagai dilewati", () => {
  const o = outcomes(buildJobs(false, true), "tes");
  expect(o).toEqual({ lint: "lulus", tes: "gagal", build: "dilewati", deploy: "dilewati" });
});

test("tanpa needs deploy tetap jalan walau tes gagal", () => {
  expect(outcomes(buildJobs(false, false), "tes").deploy).toBe("lulus");
});

test("matrix: satu versi gagal menghentikan build", () => {
  const j = buildJobs(true, true);
  expect(j).toHaveLength(6);
  const o = outcomes(j, "tes-20");
  expect(o["tes-18"]).toBe("lulus");
  expect(o.build).toBe("dilewati");
});

test("view per tick", () => {
  const j = buildJobs(false, true);
  expect(view(j, null, -1).lint.phase).toBe("menunggu");
  expect(view(j, null, 2).lint).toEqual({ phase: "jalan", step: 2 });
  expect(view(j, null, 3).build).toEqual({ phase: "jalan", step: 0 });
  expect(view(j, "lint", 9).deploy.phase).toBe("dilewati");
  expect(view(j, "lint", 9).lint.phase).toBe("gagal");
});

test("yaml memuat needs", () => {
  expect(yaml(buildJobs(false, true), false).map((r) => r.text)).toContain("    needs: [lint, tes]");
});
