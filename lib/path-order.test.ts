import { expect, test } from "vitest";
import { inPathOrder } from "./path-order";

const t = (...slugs: string[]) => slugs.map((slug) => ({ slug }));
const node = (slug: string, position: number) => ({ slug, position });

test("follows roadmap order then node position, shared classes keep their first place, the rest stay last in order", () => {
  const tracks = [{ nodes: [node("b", 1), node("a", 0)] }, { nodes: [node("c", 0), node("a", 1)] }];
  expect(inPathOrder(t("z", "c", "y", "a", "b"), tracks).map((x) => x.slug)).toEqual(["a", "b", "c", "z", "y"]);
});
