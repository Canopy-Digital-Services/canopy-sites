import { describe, expect, it } from "vitest";
import {
  nameRequiredParts,
  namePartLabel,
  orderNameParts,
} from "../../embed/src/name";

describe("nameRequiredParts", () => {
  it("is the field's own list of required parts", () => {
    expect(nameRequiredParts({ parts: ["first", "middle", "last"], requiredParts: ["first", "middle"] }, true)).toEqual([
      "first",
      "middle",
    ]);
  });

  it("without a list, requires every part of a required Name but the middle", () => {
    expect(nameRequiredParts({ parts: ["first", "middleInitial", "last"] }, true)).toEqual(["first", "last"]);
    expect(nameRequiredParts({ parts: ["first", "last"] }, false)).toEqual([]);
  });
});

describe("namePartLabel", () => {
  it("uses the user's label, then the part's default", () => {
    expect(namePartLabel("last", { last: "Surname" })).toBe("Surname");
    expect(namePartLabel("first", { last: "Surname" })).toBe("First");
  });
});

describe("orderNameParts", () => {
  it("shows a middle saved after the last name between the two", () => {
    expect(orderNameParts(["first", "last", "middleInitial"])).toEqual(["first", "middleInitial", "last"]);
  });
});
