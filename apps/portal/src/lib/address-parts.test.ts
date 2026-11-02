import { describe, expect, it } from "vitest";
import { addressError, addressParts } from "../../embed/src/address";

const full = { line1: "1 Main St", line2: "", city: "Sacramento", region: "CA", postalCode: "95814" };

describe("addressParts", () => {
  it("asks for every part until the user picks, and keeps form order", () => {
    expect(addressParts(null)).toEqual(["line1", "line2", "city", "region", "postalCode"]);
    expect(addressParts({ parts: ["postalCode", "city"] })).toEqual(["city", "postalCode"]);
  });
});

describe("addressError", () => {
  it("accepts a full address without an apartment", () => {
    expect(addressError(full, null, true)).toBeNull();
  });

  it("without a list of required parts, requires every part of a required address but the apartment", () => {
    expect(addressError({ ...full, city: "" }, null, true)).toBe("City is required.");
    expect(addressError({}, null, false)).toBeNull();
  });

  it("requires only the parts marked required", () => {
    expect(
      addressError({ postalCode: "95814" }, { parts: ["line1", "city", "region", "postalCode"], requiredParts: ["postalCode"] }, true)
    ).toBeNull();
    expect(addressError({ city: "Sacramento" }, { parts: ["city", "postalCode"], requiredParts: ["postalCode"] }, true)).toBe(
      "ZIP is required."
    );
  });

  it("holds each part, filled in or optional, to 200 characters", () => {
    expect(addressError({ ...full, line1: "x".repeat(200) }, null, true)).toBeNull();
    expect(addressError({ ...full, line1: "x".repeat(201) }, null, true)).toBe("Street must be at most 200 characters.");
    expect(addressError({ ...full, line2: "x".repeat(201) }, null, true)).toBe("Apt, suite must be at most 200 characters.");
    expect(addressError({ region: "x".repeat(201) }, null, false)).toBe("State must be at most 200 characters.");
  });

  it("checks a ZIP that's filled in, naming the part as the user labeled it", () => {
    expect(
      addressError({ postalCode: "9581" }, { parts: ["postalCode"], partLabels: { postalCode: "Zip code" } }, false)
    ).toBe("Zip code must be a US ZIP code, like 12345 or 12345-6789.");
  });
});
