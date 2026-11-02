import { describe, expect, it } from "vitest";
import { choiceError, choiceList } from "../../embed/src/choices";

const sizes = { options: ["Small", "Medium", "Large"].map((s) => ({ value: s, label: s })) };
const withOther = { ...sizes, allowOther: true };

describe("choiceList", () => {
  it("reads today's options and the bare list older fields stored", () => {
    expect(choiceList(sizes)).toHaveLength(3);
    expect(choiceList([{ value: "A", label: "A" }])).toEqual([{ value: "A", label: "A" }]);
    expect(choiceList(null)).toEqual([]);
  });
});

describe("choiceError", () => {
  it("accepts the options a field offers", () => {
    expect(choiceError("DROPDOWN", "Medium", sizes, "Size")).toBeNull();
    expect(choiceError("CHECKBOXES", ["Small", "Large"], sizes, "Sizes")).toBeNull();
  });

  it("refuses an answer off the list unless the field offers Other", () => {
    expect(choiceError("DROPDOWN", "Huge", sizes, "Size")).toBe("Size must be one of its options.");
    expect(choiceError("CHECKBOXES", ["Small", "Huge"], sizes, "Sizes")).toBe("Sizes must be one of its options.");
    expect(choiceError("DROPDOWN", "Huge", withOther, "Size")).toBeNull();
    expect(choiceError("CHECKBOXES", ["Small", "Huge"], withOther, "Sizes")).toBeNull();
  });

  it("takes one Other answer at most, of a bounded length", () => {
    expect(choiceError("CHECKBOXES", ["Huge", "Tiny"], withOther, "Sizes")).toBe("Sizes must be one of its options.");
    expect(choiceError("DROPDOWN", "x".repeat(201), withOther, "Size")).toBe("Size must be 200 characters or fewer.");
  });

  it("refuses a dropdown answer that isn't text, or checkboxes that aren't a list", () => {
    expect(choiceError("DROPDOWN", ["Small"], sizes, "Size")).toBe("Size must be one of its options.");
    expect(choiceError("CHECKBOXES", "Small", sizes, "Sizes")).toBe("Sizes must be one of its options.");
  });
});
