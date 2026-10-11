import { expect, test } from "vitest";
import { buildSandboxDoc } from "./sandbox-doc";

test("learner code cannot close the harness script early", () => {
  const doc = buildSandboxDoc({ kind: "js", files: { code: "const s = '</script><script>alert(1)</script>';" }, setup: "", tests: [], nonce: "n1" });
  expect(doc.match(/<\/script>/gi)).toHaveLength(1);
  expect(doc).toContain('"n1"');
});

test("checks cannot close the harness script early either", () => {
  const doc = buildSandboxDoc({ kind: "express", files: { code: "" }, setup: "", tests: [{ name: "</script>", check: "'</SCRIPT>' && true" }], nonce: "n" });
  expect(doc.match(/<\/script>/gi)).toHaveLength(1);
});

test("web documents carry the learner's html and css", () => {
  const doc = buildSandboxDoc({ kind: "web", files: { html: "<h1>Halo</h1>", css: "h1{color:red}", js: "" }, setup: "", tests: [], nonce: "n2" });
  expect(doc).toContain("<h1>Halo</h1>");
  expect(doc).toContain("h1{color:red}");
});
