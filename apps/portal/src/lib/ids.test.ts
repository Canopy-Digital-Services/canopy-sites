import { describe, expect, it } from "vitest";
import { requireId, requireIds } from "./ids";

describe("requireId", () => {
  it("returns a non-empty string as it is", () => {
    expect(requireId("cmw3yqtxu00000to0xkyday9i")).toBe("cmw3yqtxu00000to0xkyday9i");
  });

  it("refuses anything else, naming what was asked for", () => {
    for (const value of [{ not: "" }, { in: ["a", "b"] }, ["a"], null, undefined, 7, true, ""]) {
      expect(() => requireId(value, "form id")).toThrow("Invalid form id");
    }
  });
});

describe("requireIds", () => {
  it("returns a list of ids as it is", () => {
    expect(requireIds(["a", "b"])).toEqual(["a", "b"]);
    expect(requireIds([])).toEqual([]);
  });

  it("refuses a value that isn't a list, and a list holding anything but ids", () => {
    for (const value of ["ab", { length: 1, 0: "a" }, null, [["a"]], ["a", { not: "" }], ["a", ""]]) {
      expect(() => requireIds(value, "field ids")).toThrow("Invalid field ids");
    }
  });
});
