import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  anywhereToday,
  dateOfBirth,
  characterLimit,
  numberAnswer,
  websiteAddress,
  isValidEmail,
  validateField,
  validateSubmission,
  type ValidatedField,
} from "../../embed/src/validation";
import { phoneNumber, storedPhone } from "../../embed/src/phone";

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
    expect(validateField(field("TEXTAREA", { validation: { maxLength: 5 } }), "")).toBeNull();
  });

  it("names the field by its label, or by its name without one", () => {
    expect(validateField(field("TEXT", { label: "", name: "city", required: true }), "")).toBe("city is required.");
  });
});

describe("validateField: length", () => {
  it("holds Text to 200 characters, whatever rules an older field has stored", () => {
    expect(validateField(field("TEXT"), "x".repeat(200))).toBeNull();
    expect(validateField(field("TEXT"), "x".repeat(201))).toBe("Answer must be 200 characters or fewer.");
    const older = field("TEXT", { validation: { minLength: 5, maxLength: 3, format: "numbers" } as never });
    expect(validateField(older, "ab")).toBeNull();
  });

  it("holds a Paragraph to its character limit, in GOV.UK's words", () => {
    const message = field("TEXTAREA", { label: "Message", validation: { maxLength: 1 } });
    expect(validateField(message, "x")).toBeNull();
    expect(validateField(message, "xy")).toBe("Message must be 1 character or fewer.");
    const story = field("TEXTAREA", { label: "Story", validation: { maxLength: 2000 } });
    expect(validateField(story, "x".repeat(2001))).toBe("Story must be 2,000 characters or fewer.");
  });

  it("takes a Paragraph's limit only as a whole number from 1 to 10,000, else up to 10,000", () => {
    expect(characterLimit(field("TEXTAREA", { validation: { maxLength: 240 } }))).toBe(240);
    for (const maxLength of [0, -5, 2.5, 10001]) {
      expect(characterLimit(field("TEXTAREA", { validation: { maxLength } }))).toBeUndefined();
    }
    expect(characterLimit(field("TEXT", { validation: { maxLength: 240 } }))).toBeUndefined();
    expect(validateField(field("TEXTAREA"), "x".repeat(10000))).toBeNull();
    expect(validateField(field("TEXTAREA"), "x".repeat(10001))).toBe("Answer must be 10,000 characters or fewer.");
  });

  it("refuses a Number or Date answer past its cap before checking what it says", () => {
    expect(validateField(field("NUMBER"), "1".repeat(50))).toBeNull();
    expect(validateField(field("NUMBER"), "1".repeat(51))).toBe("Answer must be 50 characters or fewer.");
    expect(validateField(field("DATE"), "2026-11-02T10:00:00.000-08:00", nov2)).toBeNull();
    expect(validateField(field("DATE"), "x".repeat(31), nov2)).toBe("Answer must be 30 characters or fewer.");
  });
});

describe("validateField: website", () => {
  const site = field("WEBSITE", { label: "Website" });

  it("takes an address with or without its https://", () => {
    for (const address of ["example.com", "www.example.co.uk/about?ref=1", "https://example.com", "HTTP://example.com:8080", "httpbin.org"]) {
      expect(validateField(site, address)).toBeNull();
    }
  });

  it("refuses what isn't a web address, in GOV.UK's words", () => {
    for (const address of ["localhost", "example", "example.com.", "ftp://example.com", "javascript:alert(1)", "ann@example.com", "my site.com"]) {
      expect(validateField(site, address)).toBe("Website must be a web address, like example.com.");
    }
  });

  it("gives an address without one https://, and leaves one with it as typed", () => {
    expect(websiteAddress(" example.com/about ")).toBe("https://example.com/about");
    expect(websiteAddress("http://Example.com")).toBe("http://Example.com");
    expect(websiteAddress("example")).toBeNull();
  });
});

describe("validateField: email", () => {
  const email = field("EMAIL", { label: "Email" });

  it("checks the address with the spaces around it trimmed, in GOV.UK's words", () => {
    expect(validateField(email, " ann@example.com ")).toBeNull();
    expect(validateField(email, "ann@")).toBe("Email must be an email address, like name@example.com.");
  });

});

describe("isValidEmail", () => {
  it("refuses a line break, which would reach an email header", () => {
    expect(isValidEmail("ann@example.com\r\nBcc: x@example.com")).toBe(false);
    expect(isValidEmail(`${"a".repeat(310)}@example.com`)).toBe(false);
  });
});

describe("validateField: phone", () => {
  const phone = field("PHONE", { label: "Phone" });
  const withExtension = field("PHONE", {
    label: "Phone",
    validation: { parts: ["number", "extension"], partLabels: { extension: "Extension" } },
  });
  const message = "Phone must be a phone number, like (201) 555-0123 or +44 20 7946 0958.";

  it("takes a US or Canadian number with its area code, or another country's from its +", () => {
    for (const number of ["(201) 555-0123", "201.555.0123", "1-201-555-0123", "+1 201 555 0123", "+44 20 7946 0958"]) {
      expect(validateField(phone, { number })).toBeNull();
    }
  });

  it("refuses a number without its area code, with letters, or past its length, in GOV.UK's words", () => {
    for (const number of ["555-0123", "+1 555 0123", "44 20 7946 0958", "1-800-FLOWERS", "+12", "5".repeat(60000)]) {
      expect(validateField(phone, { number })).toBe(message);
    }
  });

  it("is its parts: an object with the number, and an extension only where the field asks for one", () => {
    expect(validateField(phone, "(201) 555-0123")).toBe("Phone must be an object of its parts.");
    expect(validateField(phone, { number: "(201) 555-0123", extension: "45" })).toBe('Phone has no part "extension".');
    expect(validateField(withExtension, { number: "(201) 555-0123", extension: "45" })).toBeNull();
  });

  it("takes an extension of digits, and only with a number", () => {
    expect(validateField(withExtension, { number: "(201) 555-0123", extension: "x45" })).toBe(
      "Extension must be a number, like 45."
    );
    expect(validateField(withExtension, { number: "", extension: "45" })).toBe("Phone must include a phone number.");
    expect(validateField({ ...withExtension, required: true }, { number: " ", extension: "" })).toBe("Phone is required.");
    expect(validateField(withExtension, { number: "", extension: "" })).toBeNull();
  });

  it("stores the number one way, E.164, and only the parts given", () => {
    expect(phoneNumber("1 201 555 0123")).toBe("+12015550123");
    expect(phoneNumber("+44 (20) 7946.0958")).toBe("+442079460958");
    expect(storedPhone({ number: "(201) 555-0123", extension: " 45 " })).toEqual({ number: "+12015550123", extension: "45" });
    expect(storedPhone({ number: "(201) 555-0123", extension: "" })).toEqual({ number: "+12015550123" });
  });
});

describe("validateField: number", () => {
  const guests = field("NUMBER", { label: "Guests", validation: { min: 1, max: 20, integer: true } });
  const budget = field("NUMBER", { label: "Budget", validation: { max: 500 } });

  it("keeps to the field's range in GOV.UK's words, with an example it takes", () => {
    expect(validateField(guests, "7")).toBeNull();
    expect(validateField(guests, "twelve")).toBe("Guests must be a whole number, like 10.");
    expect(validateField(guests, "2.5")).toBe("Guests must be a whole number, like 10.");
    expect(validateField(guests, "0")).toBe("Guests must be between 1 and 20.");
    expect(validateField(field("NUMBER", { label: "Guests", validation: { min: 50 } }), "x")).toBe(
      "Guests must be a number, like 50."
    );
    expect(validateField(field("NUMBER", { label: "Guests", validation: { min: 50, integer: true } }), "2")).toBe(
      "Guests must be 50 or more."
    );
  });

  it("says fewer of a count and less of an amount", () => {
    expect(validateField(field("NUMBER", { label: "Guests", validation: { max: 20, integer: true } }), "21")).toBe(
      "Guests must be 20 or fewer."
    );
    expect(validateField(budget, "500.01")).toBe("Budget must be 500 or less.");
  });

  it("takes a number written with commas or spaces, and nothing else that isn't one", () => {
    expect(validateField(budget, "1,000")).toBe("Budget must be 500 or less.");
    expect(validateField(budget, " 499.5 ")).toBeNull();
    expect(validateField(budget, "1e2")).toBe("Budget must be a number, like 10.");
    expect(numberAnswer("1,250.50")).toBe("1250.50");
    expect(numberAnswer("0042")).toBe("0042");
    expect(numberAnswer("-.5")).toBe("-.5");
    expect(numberAnswer("12 people")).toBeNull();
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
    expect(validateField(full, { first: "x".repeat(101), last: "Lee" })).toBe("First must be 100 characters or fewer.");
    const surname = field("NAME", { options: { parts: ["first", "last"], partLabels: { last: "Surname" } } });
    expect(validateField(surname, { first: "Ann", last: "x".repeat(101) })).toBe("Surname must be 100 characters or fewer.");
  });

  it("holds an initial to two characters, room for its period", () => {
    expect(validateField(full, { first: "Ann", middleInitial: "Qu.", last: "Lee" })).toBe(
      "M.I. must be 2 characters or fewer."
    );
  });

  it("names a single box by the field's label", () => {
    const single = field("NAME", { options: { parts: ["single"] } });
    expect(validateField(single, { single: "x".repeat(101) })).toBe("Answer must be 100 characters or fewer.");
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
      email: "Answer must be an email address, like name@example.com.",
    });
  });

  it("reads only the answers' own keys", () => {
    const fields = [field("TEXT", { name: "constructor", required: true })];
    expect(validateSubmission(fields, {}, nov2)).toEqual({ constructor: "Answer is required." });
  });
});
