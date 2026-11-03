import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  anywhereToday,
  dateOfBirth,
  getEffectiveMaxLength,
  isValidEmail,
  usPhoneDigits,
  validateField,
  validateSubmission,
  type ValidatedField,
} from "../../embed/src/validation";

const field = (type: string, more: Partial<ValidatedField> = {}): ValidatedField => ({
  name: type.toLowerCase(),
  type,
  label: "Answer",
  required: false,
  ...more,
});

const nov2 = { earliest: "2026-11-02", latest: "2026-11-02" };

describe("validateField: required", () => {
  it("refuses a required answer left empty or blank, whatever the type", () => {
    expect(validateField(field("TEXT", { required: true }), "  ")).toBe("Answer is required.");
    expect(validateField(field("EMAIL", { required: true }), undefined)).toBe("Answer is required.");
    expect(validateField(field("CHECKBOX", { required: true }), false)).toBe("Answer is required.");
    expect(validateField(field("CHECKBOXES", { required: true }), [])).toBe("Answer is required.");
  });

  it("checks nothing else on an optional answer left empty", () => {
    expect(validateField(field("EMAIL"), "")).toBeNull();
    expect(validateField(field("DATE"), null)).toBeNull();
    expect(validateField(field("CHECKBOXES"), [])).toBeNull();
    expect(validateField(field("TEXT", { validation: { minLength: 5, format: "numbers" } }), "")).toBeNull();
  });

  it("names the field by its label, or by its name without one", () => {
    expect(validateField(field("TEXT", { label: "", name: "city", required: true }), "")).toBe("city is required.");
  });
});

describe("validateField: length", () => {
  it("holds text to its type's default unless the field sets its own limit", () => {
    expect(validateField(field("TEXT"), "x".repeat(201))).toBe("Answer must be at most 200 characters.");
    expect(validateField(field("TEXT", { validation: { maxLength: 10 } }), "x".repeat(11))).toBe(
      "Answer must be at most 10 characters."
    );
    expect(validateField(field("TEXT", { validation: { minLength: 3 } }), "xy")).toBe(
      "Answer must be at least 3 characters."
    );
  });

  it("never lets a field's own limit pass its type's absolute", () => {
    expect(getEffectiveMaxLength(field("TEXT", { validation: { maxLength: 1000 } }))).toBe(500);
    expect(getEffectiveMaxLength(field("TEXTAREA", { validation: { maxLength: 50000 } }))).toBe(10000);
    expect(validateField(field("TEXT", { validation: { maxLength: 1000 } }), "x".repeat(501))).toBe(
      "Answer must be at most 500 characters."
    );
  });

  it("falls back to the default when the field's limit isn't a positive whole number", () => {
    for (const maxLength of [0, -5, 2.5]) {
      expect(getEffectiveMaxLength(field("TEXT", { validation: { maxLength } }))).toBe(200);
    }
  });

  it("holds Phone, Number and Date to their type's cap, whatever limit the field has stored", () => {
    expect(getEffectiveMaxLength(field("PHONE"))).toBe(30);
    expect(getEffectiveMaxLength(field("PHONE", { validation: { maxLength: 5 } }))).toBe(30);
    expect(getEffectiveMaxLength(field("NUMBER", { validation: { maxLength: 1000 } }))).toBe(50);
    expect(getEffectiveMaxLength(field("DATE"))).toBe(30);
  });

  it("refuses a Phone, Number or Date answer past its cap before checking what it says", () => {
    expect(validateField(field("PHONE"), "5".repeat(30))).toBeNull();
    expect(validateField(field("PHONE"), "5".repeat(60000))).toBe("Answer must be at most 30 characters.");
    expect(validateField(field("PHONE", { validation: { format: "strict" } }), "5".repeat(31))).toBe(
      "Answer must be at most 30 characters."
    );
    expect(validateField(field("NUMBER"), "1".repeat(50))).toBeNull();
    expect(validateField(field("NUMBER"), "1".repeat(51))).toBe("Answer must be at most 50 characters.");
    expect(validateField(field("DATE"), "2026-11-02T10:00:00.000-08:00", nov2)).toBeNull();
    expect(validateField(field("DATE"), "x".repeat(31), nov2)).toBe("Answer must be at most 30 characters.");
  });

  it("has no limit for types without one", () => {
    expect(getEffectiveMaxLength(field("DROPDOWN"))).toBeUndefined();
  });
});

describe("validateField: text formats", () => {
  const formatted = (format: string) => field("TEXT", { validation: { format } });

  it("checks the format the field asks for", () => {
    expect(validateField(formatted("numbers"), "12a")).toBe("Answer must contain only numbers.");
    expect(validateField(formatted("letters"), "ab c")).toBe("Answer must contain only letters.");
    expect(validateField(formatted("postal-us"), "1234")).toBe(
      "Answer must be a valid US postal code (e.g., 12345 or 12345-6789)."
    );
    expect(validateField(formatted("postal-ca"), "K1A0B1")).toBeNull();
    expect(validateField(formatted("alphanumeric"), "anything at all!")).toBeNull();
  });

  it("takes a URL without its protocol, but not a bare word", () => {
    expect(validateField(formatted("url"), "example.com/page")).toBeNull();
    expect(validateField(formatted("url"), "localhost")).toBe("Answer must be a valid URL.");
  });
});

describe("validateField: email", () => {
  it("checks the address with the spaces around it trimmed", () => {
    expect(validateField(field("EMAIL"), " ann@example.com ")).toBeNull();
    expect(validateField(field("EMAIL"), "ann@")).toBe("Enter a valid email address");
  });

  it("keeps to the field's allowed or blocked domains, in any case", () => {
    const allow = field("EMAIL", { validation: { domainRules: { allow: ["Example.com"] } } });
    expect(validateField(allow, "ann@EXAMPLE.com")).toBeNull();
    expect(validateField(allow, "ann@other.com")).toBe("Answer must be from an allowed domain.");
    const block = field("EMAIL", { validation: { domainRules: { block: ["mail.test"] } } });
    expect(validateField(block, "ann@Mail.test")).toBe("Answer domain is not allowed.");
  });
});

describe("isValidEmail", () => {
  it("refuses a line break, which would reach an email header", () => {
    expect(isValidEmail("ann@example.com\r\nBcc: x@example.com")).toBe(false);
    expect(isValidEmail(`${"a".repeat(310)}@example.com`)).toBe(false);
  });
});

describe("validateField: phone", () => {
  it("takes any common way of writing a number when lenient, the default", () => {
    expect(validateField(field("PHONE"), "+44 (20) 7946.0958")).toBeNull();
    expect(validateField(field("PHONE"), "555-12")).toBe("Answer must be a valid phone number.");
  });

  it("takes only a US number when strict", () => {
    const strict = field("PHONE", { validation: { format: "strict" } });
    expect(validateField(strict, "1 (916) 555-0100")).toBeNull();
    expect(validateField(strict, "+44 20 7946 0958")).toBe("Answer must be a valid US phone number (10 digits).");
  });

  it("reads the ten digits from a US number however it's written", () => {
    expect(usPhoneDigits("+1 916 555 0100")).toBe("9165550100");
    expect(usPhoneDigits("1-916-555-0100")).toBe("9165550100");
    expect(usPhoneDigits("916.555.0100")).toBe("9165550100");
    expect(usPhoneDigits("+44 916 555 0100")).toBeNull();
    expect(usPhoneDigits("555 0100")).toBeNull();
  });
});

describe("validateField: number", () => {
  const ranged = field("NUMBER", { validation: { min: 1, max: 10, integer: true } });

  it("keeps to the field's range and whole numbers", () => {
    expect(validateField(ranged, "7")).toBeNull();
    expect(validateField(ranged, "abc")).toBe("Answer must be a number.");
    expect(validateField(ranged, "2.5")).toBe("Answer must be a whole number.");
    expect(validateField(ranged, "0")).toBe("Answer must be at least 1.");
    expect(validateField(ranged, "11")).toBe("Answer must be at most 10.");
  });
});

describe("validateField: date", () => {
  const future = field("DATE", { validation: { minDate: "today" } });
  const past = field("DATE", { validation: { maxDate: "today" } });

  it("refuses a date that isn't one, including a day the month doesn't have", () => {
    expect(validateField(field("DATE"), "soon", nov2)).toBe("Answer must be a real date.");
    expect(validateField(field("DATE"), "2026-02-30", nov2)).toBe("Answer must be a real date.");
  });

  it("keeps a Future Date to today or later, and a Past Date to today or earlier", () => {
    expect(validateField(future, "2026-11-02", nov2)).toBeNull();
    expect(validateField(past, "2026-11-02", nov2)).toBeNull();
    expect(validateField(future, "2026-11-01", nov2)).toBe("Answer must be today or in the future.");
    expect(validateField(past, "2026-11-03", nov2)).toBe("Answer must be today or in the past.");
  });

  it("takes any date when an older field holds a fixed one", () => {
    const fixed = field("DATE", { validation: { minDate: "2026-11-10", maxDate: "2026-11-20" } });
    expect(validateField(fixed, "2020-01-01", nov2)).toBeNull();
  });

  it("on the server, takes any date that is today somewhere", () => {
    const today = anywhereToday(new Date("2026-11-02T20:00:00Z"));
    expect(today).toEqual({ earliest: "2026-11-02", latest: "2026-11-03" });
    expect(validateField(past, "2026-11-03", today)).toBeNull();
    expect(validateField(past, "2026-11-04", today)).toBe("Answer must be today or in the past.");
    expect(anywhereToday(new Date("2026-11-02T06:00:00Z"))).toEqual({ earliest: "2026-11-01", latest: "2026-11-02" });
  });

  describe("west of UTC", () => {
    const zone = process.env.TZ;
    beforeAll(() => {
      process.env.TZ = "America/Los_Angeles";
    });
    afterAll(() => {
      process.env.TZ = zone;
    });

    it("compares the day the visitor picked", () => {
      expect(new Date(2026, 10, 2).getTimezoneOffset()).toBe(480);
      expect(validateField(future, "2026-11-02", nov2)).toBeNull();
      expect(validateField(future, "2026-11-01", nov2)).toBe("Answer must be today or in the future.");
    });
  });
});

describe("validateField: date of birth", () => {
  const born = field("DATE_OF_BIRTH", { label: "Date of birth" });

  it("takes a real date before today, written as its boxes join it", () => {
    expect(validateField(born, "1980-3-27", nov2)).toBeNull();
    expect(validateField(born, "2026-11-01", nov2)).toBeNull();
    expect(validateField(born, "", nov2)).toBeNull();
    expect(validateField({ ...born, required: true }, "", nov2)).toBe("Date of birth is required.");
  });

  it("names the box that's missing, a month first, as GOV.UK does", () => {
    expect(validateField(born, "1980--27", nov2)).toBe("Date of birth must include a month.");
    expect(validateField(born, "1980-03-", nov2)).toBe("Date of birth must include a day.");
    expect(validateField(born, "-03-27", nov2)).toBe("Date of birth must include a year.");
    expect(validateField(born, "80-03-27", nov2)).toBe("Year must include 4 numbers.");
  });

  it("refuses a date that isn't one, and today or later", () => {
    expect(validateField(born, "1980-02-30", nov2)).toBe("Date of birth must be a real date.");
    expect(validateField(born, "1980-13-01", nov2)).toBe("Date of birth must be a real date.");
    expect(validateField(born, "2026-11-02", nov2)).toBe("Date of birth must be in the past.");
    expect(validateField(born, "2030-01-01", nov2)).toBe("Date of birth must be in the past.");
  });

  it("on the server, takes a date before today anywhere", () => {
    const today = anywhereToday(new Date("2026-11-02T20:00:00Z"));
    expect(validateField(born, "2026-11-02", today)).toBeNull();
    expect(validateField(born, "2026-11-03", today)).toBe("Date of birth must be in the past.");
  });

  it("reads the date its boxes name", () => {
    expect(dateOfBirth("1980-3-7")).toBe("1980-03-07");
    expect(dateOfBirth("1980-02-30")).toBeNull();
    expect(dateOfBirth("1980--7")).toBeNull();
  });
});

describe("validateField: composite and choice fields", () => {
  it("leaves Name, Address and choices to their own rules", () => {
    expect(validateField(field("NAME", { required: true }), { first: "Ann", last: " " })).toBe("Last is required.");
    expect(validateField(field("ADDRESS"), { postalCode: "123" })).toBe(
      "ZIP must be a US ZIP code, like 12345 or 12345-6789."
    );
    const sizes = { options: [{ value: "S", label: "S" }] };
    expect(validateField(field("DROPDOWN", { options: sizes }), "XL")).toBe("Answer must be one of its options.");
    expect(validateField(field("CHECKBOXES", { options: sizes }), "S")).toBe("Answer must be one of its options.");
  });
});

describe("validateField: name parts", () => {
  const full = field("NAME", { options: { parts: ["first", "middleInitial", "last"] } });

  it("holds each part to 100 characters, naming it as the user labeled it", () => {
    expect(validateField(full, { first: "x".repeat(100), middleInitial: "Q.", last: "Lee" })).toBeNull();
    expect(validateField(full, { first: "x".repeat(101), last: "Lee" })).toBe("First must be at most 100 characters.");
    const surname = field("NAME", { options: { parts: ["first", "last"], partLabels: { last: "Surname" } } });
    expect(validateField(surname, { first: "Ann", last: "x".repeat(101) })).toBe("Surname must be at most 100 characters.");
  });

  it("holds an initial to two characters, room for its period", () => {
    expect(validateField(full, { first: "Ann", middleInitial: "Qu.", last: "Lee" })).toBe(
      "M.I. must be at most 2 characters."
    );
  });

  it("names a single box by the field's label", () => {
    const single = field("NAME", { options: { parts: ["single"] } });
    expect(validateField(single, { single: "x".repeat(101) })).toBe("Answer must be at most 100 characters.");
  });
});

describe("validateField: Name and Address parts", () => {
  const name = field("NAME");
  const address = field("ADDRESS", { options: { parts: ["line1", "city"] } });

  it("takes only the parts the field asks for", () => {
    expect(validateField(name, { first: "Ann", last: "Lee" })).toBeNull();
    expect(validateField(name, { first: "Ann", last: "Lee", middle: "B" })).toBe('Answer has no part "middle".');
    expect(validateField(address, { line1: "1 Main St", postalCode: "12345" })).toBe(
      'Answer has no part "postalCode".'
    );
  });

  it("takes an object of parts, each a piece of text", () => {
    expect(validateField(name, "Ann Lee")).toBe("Answer must be an object of its parts.");
    expect(validateField(address, ["1 Main St"])).toBe("Answer must be an object of its parts.");
    expect(validateField(name, { first: { junk: "x" } })).toBe("First must be text.");
    expect(validateField(field("NAME", { options: { parts: ["single"] } }), { single: 7 })).toBe("Answer must be text.");
    expect(validateField(address, { city: ["Sacramento"] })).toBe("City must be text.");
  });
});

describe("validateField: answer shapes", () => {
  it("takes text where the answer is one piece of it, and a number for Number too", () => {
    expect(validateField(field("TEXT"), { junk: "x" })).toBe("Answer must be text.");
    expect(validateField(field("TEXT"), ["a"])).toBe("Answer must be text.");
    expect(validateField(field("TEXT"), 12345)).toBe("Answer must be text.");
    expect(validateField(field("DATE"), ["2026-11-02"], nov2)).toBe("Answer must be text.");
    expect(validateField(field("NUMBER"), 7)).toBeNull();
    expect(validateField(field("NUMBER"), [7])).toBe("Answer must be a number.");
  });

  it("takes true, false, or what an HTML checkbox sends, for a checkbox", () => {
    expect(validateField(field("CHECKBOX"), true)).toBeNull();
    expect(validateField(field("CHECKBOX"), false)).toBeNull();
    expect(validateField(field("CHECKBOX"), "on")).toBeNull();
    expect(validateField(field("CHECKBOX"), "x".repeat(1000))).toBe("Answer must be true or false.");
  });
});

describe("validateSubmission", () => {
  it("reports each field's first error by name, and nothing for fields that pass", () => {
    const fields = [field("TEXT", { required: true }), field("EMAIL"), field("NUMBER")];
    expect(validateSubmission(fields, { email: "nope", number: "4" }, nov2)).toEqual({
      text: "Answer is required.",
      email: "Enter a valid email address",
    });
  });

  it("reads only the answers' own keys", () => {
    const fields = [field("TEXT", { name: "constructor", required: true })];
    expect(validateSubmission(fields, {}, nov2)).toEqual({ constructor: "Answer is required." });
  });
});
