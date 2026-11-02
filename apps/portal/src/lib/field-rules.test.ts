import { describe, expect, it } from "vitest";
import { fieldProblem, newFieldDefaults, savedChoices, savedField } from "./field-rules";

const options = (...labels: string[]) => labels.map((l) => ({ value: l, label: l }));

describe("newFieldDefaults", () => {
  it("starts every field complete enough to save", () => {
    for (const type of ["TEXT", "DROPDOWN", "CHECKBOXES", "NAME", "ADDRESS"]) {
      expect(fieldProblem(newFieldDefaults(type))).toBeNull();
    }
  });

  it("requires a new Name or Address, all but the middle name and apartment", () => {
    expect(newFieldDefaults("NAME")).toMatchObject({ required: true, options: { requiredParts: ["first", "last"] } });
    expect(newFieldDefaults("ADDRESS").options).toMatchObject({ requiredParts: ["line1", "city", "region", "postalCode"] });
    expect(newFieldDefaults("TEXT").required).toBe(false);
  });
});

describe("fieldProblem", () => {
  it("needs a choice field to offer one option, blanks not counting", () => {
    expect(fieldProblem({ type: "DROPDOWN", options: { options: options("", " ") } })).toBe("Add at least one option to save.");
    expect(fieldProblem({ type: "DROPDOWN", options: { options: options("Small", "") } })).toBeNull();
  });

  it("refuses options a visitor couldn't tell apart, Other included", () => {
    expect(fieldProblem({ type: "CHECKBOXES", options: { options: options("Red", "red ") } })).toBe(
      "Options must be different to save."
    );
    expect(fieldProblem({ type: "CHECKBOXES", options: { options: options("Other"), allowOther: true } })).toBe(
      "Options must be different to save."
    );
  });

  it("needs a Name or Address to collect a part", () => {
    expect(fieldProblem({ type: "NAME", options: { parts: [] } })).toBe("Choose at least one name part to save.");
    expect(fieldProblem({ type: "ADDRESS", options: { parts: [] } })).toBe("Choose at least one address part to save.");
    expect(fieldProblem({ type: "NAME", options: null })).toBeNull();
  });
});

describe("savedChoices", () => {
  it("drops blanks, trims, and keeps a default only while its option is there", () => {
    expect(savedChoices({ options: options(" Small ", "", "Large"), defaultValue: "Small " })).toEqual({
      options: options("Small", "Large"),
      defaultValue: "Small",
    });
    expect(savedChoices({ options: options("Small"), defaultValue: "Huge" })).toEqual({ options: options("Small") });
  });
});

describe("savedField", () => {
  it("trims text and gives a blank label the type's name", () => {
    expect(savedField({ type: "EMAIL", label: "  ", placeholder: " ", helpText: " Work email " })).toMatchObject({
      label: "Email",
      placeholder: null,
      helpText: "Work email",
    });
  });

  it("keeps only the config the type keeps", () => {
    expect(savedField({ type: "TEXT", label: "Text", options: { options: [] }, validation: { maxLength: 5 } })).toMatchObject(
      { options: null, validation: { maxLength: 5 } }
    );
    expect(savedField({ type: "DROPDOWN", label: "Size", options: { options: options("S") }, validation: { x: 1 } })).toMatchObject(
      { validation: null }
    );
  });

  it("keeps a Name's labels and requirements to the parts it collects, in form order", () => {
    const saved = savedField({
      type: "NAME",
      label: "Name",
      required: true,
      options: { parts: ["last", "first"], requiredParts: ["last", "middle"], partLabels: { middle: "Middle", last: "Surname" } },
    });
    expect(saved.options).toEqual({ parts: ["first", "last"], requiredParts: ["last"], partLabels: { last: "Surname" } });
  });

  it("makes a Name or Address required while any part is, whatever the request said", () => {
    expect(savedField({ type: "ADDRESS", label: "Address", required: true, options: { parts: ["postalCode"], requiredParts: [] } }).required).toBe(false);
    expect(savedField({ type: "ADDRESS", label: "Address", required: false, options: { parts: ["postalCode"], requiredParts: ["postalCode"] } }).required).toBe(true);
    // Without a list of required parts (stored before there was one), `required` stands.
    expect(savedField({ type: "NAME", label: "Name", required: true, options: { parts: ["first"] } }).required).toBe(true);
  });
});
