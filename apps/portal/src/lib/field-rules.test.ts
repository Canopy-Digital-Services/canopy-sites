import { describe, expect, it } from "vitest";
import { dateRule, dateWhen, fieldProblem, newFieldDefaults, savedChoices, savedField } from "./field-rules";

const options = (...labels: string[]) => labels.map((l) => ({ value: l, label: l }));

describe("newFieldDefaults", () => {
  it("starts every field complete enough to save", () => {
    for (const type of ["TEXT", "DROPDOWN", "CHECKBOXES", "NAME", "ADDRESS", "DATE_OF_BIRTH"]) {
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

  it("refuses a Number range that runs backwards or closes up", () => {
    const problem = (min: number, max: number) => fieldProblem({ type: "NUMBER", options: null, validation: { min, max } });
    expect(problem(10, 5)).toBe("Minimum must be lower than maximum.");
    expect(problem(5, 5)).toBe("Minimum must be lower than maximum.");
    expect(problem(4, 5)).toBeNull();
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
    expect(savedField({ type: "EMAIL", label: "  ", helpText: " Work email " })).toMatchObject({
      label: "Email",
      helpText: "Work email",
    });
    expect(savedField({ type: "EMAIL", label: "Email", helpText: " " }).helpText).toBeNull();
  });

  it("keeps only the config the type keeps", () => {
    expect(savedField({ type: "TEXT", label: "Text", options: { options: [] }, validation: { maxLength: 5 } })).toMatchObject(
      { options: null, validation: { maxLength: 5 } }
    );
    expect(savedField({ type: "DROPDOWN", label: "Size", options: { options: options("S") }, validation: { x: 1 } })).toMatchObject(
      { validation: null }
    );
  });

  it("keeps a Number's kind and the bounds that are numbers", () => {
    expect(newFieldDefaults("NUMBER").validation).toEqual({ integer: true });
    expect(savedField({ type: "NUMBER", label: "Guests", validation: { integer: true, min: 1, max: null } }).validation).toEqual({
      integer: true,
      min: 1,
    });
    expect(savedField({ type: "NUMBER", label: "Guests", validation: { integer: false, maxLength: 5 } }).validation).toBeNull();
  });

  it("keeps no rules for a Date of birth, which has none to set", () => {
    expect(savedField({ type: "DATE_OF_BIRTH", label: " ", validation: { maxDate: "today" } })).toMatchObject({
      label: "Date of birth",
      validation: null,
    });
  });

  it("keeps a Date's choice of past or future dates, and drops a fixed date", () => {
    expect(savedField({ type: "DATE", label: "Date", validation: { minDate: "today" } }).validation).toEqual({ minDate: "today" });
    expect(savedField({ type: "DATE", label: "Date", validation: { maxDate: "today" } }).validation).toEqual({ maxDate: "today" });
    expect(savedField({ type: "DATE", label: "Date", validation: { minDate: "2026-01-01", maxDate: "today" } }).validation).toEqual({
      maxDate: "today",
    });
    expect(savedField({ type: "DATE", label: "Date", validation: { minDate: "2026-01-01" } }).validation).toBeNull();
    expect(dateRule(dateWhen({ minDate: "today" }))).toEqual({ minDate: "today" });
    expect(dateRule("any")).toBeNull();
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
