import { describe, expect, it } from "vitest";
import { rerender } from "./react-render";

describe("react-render", () => {
  it("tanpa memo semua turunan ikut render", () => {
    expect([...rerender("App", {}).rendered].sort()).toEqual(["App", "Counter", "Header", "Item1", "Item2", "List"]);
  });
  it("memo melewati anak dengan props sama, tapi tidak Counter yang props-nya berubah", () => {
    const r = rerender("App", { Header: true, List: true, Counter: true });
    expect([...r.rendered].sort()).toEqual(["App", "Counter"]);
    expect([...r.skipped].sort()).toEqual(["Header", "List"]);
  });
  it("state lokal Counter hanya merender Counter", () => {
    expect([...rerender("Counter", {}).rendered]).toEqual(["Counter"]);
  });
});
