import { describe, expect, it } from "vitest";
import {
  isNamePartRequired,
  namePartLabel,
  orderNameParts,
} from "../../embed/src/name";

describe("isNamePartRequired", () => {
  it("requires every part of a required Name but the middle", () => {
    expect(isNamePartRequired("first", true)).toBe(true);
    expect(isNamePartRequired("last", true)).toBe(true);
    expect(isNamePartRequired("single", true)).toBe(true);
    expect(isNamePartRequired("middle", true)).toBe(false);
    expect(isNamePartRequired("middleInitial", true)).toBe(false);
  });

  it("requires nothing of an optional Name", () => {
    expect(isNamePartRequired("first", false)).toBe(false);
    expect(isNamePartRequired("single", false)).toBe(false);
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
