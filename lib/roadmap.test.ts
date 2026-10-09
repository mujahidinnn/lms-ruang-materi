import { describe, expect, it } from "vitest";
import { layout, openPrerequisites, type RoadmapNode } from "./roadmap";

const node = (id: string, position = 0): RoadmapNode => ({
  id,
  topicId: id,
  slug: id,
  title: id,
  summary: "",
  optional: false,
  position,
  practiceCount: 0,
  cardCount: 0,
  hasExam: false,
});

describe("layout", () => {
  it("puts each node right of its longest prerequisite chain", () => {
    // html -> css -> js, html -> js, js -> dom, js -> fetch
    const placed = layout(
      [node("dom"), node("js"), node("fetch", 1), node("css"), node("html")],
      [
        { from: "html", to: "css" },
        { from: "css", to: "js" },
        { from: "html", to: "js" },
        { from: "js", to: "dom" },
        { from: "js", to: "fetch" },
      ]
    );
    expect(placed.map((n) => [n.id, n.column, n.row])).toEqual([
      ["html", 0, 0],
      ["css", 1, 0],
      ["js", 2, 0],
      ["dom", 3, 0],
      ["fetch", 3, 1],
    ]);
  });

  it("keeps nodes without edges in column 0, ordered by position", () => {
    const placed = layout([node("b", 2), node("a", 1)], []);
    expect(placed.map((n) => [n.id, n.column, n.row])).toEqual([
      ["a", 0, 0],
      ["b", 0, 1],
    ]);
  });
});

describe("openPrerequisites", () => {
  const edges = [
    { from: "html", to: "js" },
    { from: "css", to: "js" },
  ];

  it("lists prerequisites that are not done or skipped", () => {
    expect(openPrerequisites("js", edges, { html: "selesai", css: "sedang" })).toEqual(["css"]);
    expect(openPrerequisites("js", edges, { html: "selesai", css: "dilewati" })).toEqual([]);
    expect(openPrerequisites("js", edges, {})).toEqual(["html", "css"]);
  });
});
