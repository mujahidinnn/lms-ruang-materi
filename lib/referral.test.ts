import { describe, expect, it } from "vitest";
import { parseRef } from "./referral";

describe("parseRef", () => {
  it("uppercases and trims a valid code", () => {
    expect(parseRef("abcd234")).toBe("ABCD234");
    expect(parseRef(" ABCD234 ")).toBe("ABCD234");
  });
  it.each(["ABCD23", "ABCD2345", "ABCD0O1", "<script>", undefined, null, 42])("rejects %s", (v) => {
    expect(parseRef(v)).toBeNull();
  });
});
