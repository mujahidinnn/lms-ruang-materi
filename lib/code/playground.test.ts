import { expect, test } from "vitest";
import { splitDocument } from "./playground";

test("splits inline style and script out of a full document", () => {
  const r = splitDocument('<!DOCTYPE html><html><head><style>h1{color:red}</style></head><body><h1>Hai</h1><script>console.log(1)</script></body></html>');
  expect(r.files.css).toBe("h1{color:red}");
  expect(r.files.js).toBe("console.log(1)");
  expect(r.files.html).toContain("<h1>Hai</h1>");
  expect(r.files.html).not.toMatch(/<style|<script/);
  expect(r.notes).toEqual([]);
});

test("drops local files with a note, keeps CDN links", () => {
  const r = splitDocument('<link rel="stylesheet" href="style.css"><link rel="stylesheet" href="https://cdn.x/a.css"><script src="script.js"></script><script src="https://cdn.x/a.js"></script>');
  expect(r.notes).toHaveLength(2);
  expect(r.notes.join(" ")).toContain("style.css");
  expect(r.notes.join(" ")).toContain("script.js");
  expect(r.files.html).toContain("https://cdn.x/a.css");
  expect(r.files.html).toContain("https://cdn.x/a.js");
  expect(r.files.html).not.toContain('href="style.css"');
});

test("leaves JSON data scripts alone and warns about modules", () => {
  const r = splitDocument('<script type="application/json">{"a":1}</script><script type="module">import x from "y"</script>');
  expect(r.files.html).toContain('{"a":1}');
  expect(r.files.js).toContain("import x");
  expect(r.notes[0]).toContain("module");
});

test("reads the page title like a browser tab", () => {
  expect(splitDocument("<head><title> Halo &amp;\n dunia </title></head>").title).toBe("Halo & dunia");
  expect(splitDocument("<h1>tanpa judul</h1>").title).toBe("");
});
