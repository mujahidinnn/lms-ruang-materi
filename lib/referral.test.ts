import { describe, expect, it } from "vitest";
import { parseRef, refFrom } from "./referral";

describe("parseRef", () => {
  it("uppercases and trims a valid code", () => {
    expect(parseRef("abcd234")).toBe("ABCD234");
    expect(parseRef(" ABCD234 ")).toBe("ABCD234");
  });
  it.each(["ABCD23", "ABCD2345", "ABCD0O1", "<script>", undefined, null, 42])("rejects %s", (v) => {
    expect(parseRef(v)).toBeNull();
  });
});

describe("refFrom", () => {
  it("prefers the cookie", () => {
    expect(refFrom("abcd234", { ref: "WXYZ234" })).toBe("ABCD234");
  });
  it("falls back to the sign-up metadata when the cookie is missing or bad", () => {
    expect(refFrom(undefined, { ref: "WXYZ234" })).toBe("WXYZ234");
    expect(refFrom("bad", { ref: "wxyz234" })).toBe("WXYZ234");
  });
  it("is null when neither is a code", () => {
    expect(refFrom(undefined, undefined)).toBeNull();
    expect(refFrom(undefined, { ref: 5 })).toBeNull();
  });
});
