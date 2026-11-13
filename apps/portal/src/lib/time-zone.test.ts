import { describe, expect, it } from "vitest";
import { canonicalTimeZone, isTimeZone, timeZoneLabel, timeZoneOptions } from "./time-zone";

/** A winter day: Pacific is on standard time, GMT-8. */
const WINTER = new Date("2026-11-13T00:20:00Z");
const SUMMER = new Date("2026-07-04T19:05:00Z");

describe("isTimeZone and canonicalTimeZone", () => {
  it("take a zone the runtime knows, spelled as the runtime spells it", () => {
    expect(isTimeZone("America/Los_Angeles")).toBe(true);
    expect(isTimeZone("UTC")).toBe(true);
    expect(canonicalTimeZone("america/los_angeles")).toBe("America/Los_Angeles");
  });

  it("refuse anything that isn't one", () => {
    for (const value of ["", "Mars/Olympus_Mons", "A".repeat(5000), null, undefined, 8, {}, ["America/Los_Angeles"]]) {
      expect(isTimeZone(value)).toBe(false);
      expect(canonicalTimeZone(value)).toBeNull();
    }
  });
});

describe("timeZoneLabel", () => {
  it("is the city and the zone's offset on that day", () => {
    expect(timeZoneLabel("America/Los_Angeles", WINTER)).toBe("Los Angeles (GMT-8)");
    expect(timeZoneLabel("America/Los_Angeles", SUMMER)).toBe("Los Angeles (GMT-7)");
    expect(timeZoneLabel("Asia/Kathmandu", WINTER)).toBe("Kathmandu (GMT+5:45)");
  });

  it("names the state or country of a city that needs one, and UTC as itself", () => {
    expect(timeZoneLabel("America/Indiana/Knox", WINTER)).toBe("Knox, Indiana (GMT-6)");
    expect(timeZoneLabel("UTC", WINTER)).toBe("UTC");
  });
});

describe("timeZoneOptions", () => {
  const options = timeZoneOptions("America/Los_Angeles", WINTER);
  const values = options.map((o) => o.value);

  it("offers every zone once, with UTC, each one the server would take", () => {
    expect(new Set(values).size).toBe(values.length);
    expect(values).toContain("UTC");
    expect(values).toContain("America/New_York");
    expect(values.every(isTimeZone)).toBe(true);
  });

  it("names each zone's time beside it, for a search by it", () => {
    expect(options.find((o) => o.value === "America/Los_Angeles")).toEqual({
      value: "America/Los_Angeles",
      label: "Los Angeles (GMT-8)",
      detail: "Pacific Time",
    });
  });

  it("runs west to east, then by place", () => {
    const at = (zone: string) => values.indexOf(zone);
    expect(at("Pacific/Honolulu")).toBeLessThan(at("America/Los_Angeles"));
    expect(at("America/Los_Angeles")).toBeLessThan(at("America/Vancouver"));
    expect(at("America/Vancouver")).toBeLessThan(at("America/Denver"));
    expect(at("America/New_York")).toBeLessThan(at("UTC"));
    expect(at("UTC")).toBeLessThan(at("Asia/Tokyo"));
  });

  it("includes the account's own zone when the list would lack it, and nothing that isn't a zone", () => {
    // Firefox reports this name; the server's runtime lists the city under an older one.
    const alias = values.includes("Asia/Kolkata") ? "Asia/Calcutta" : "Asia/Kolkata";
    expect(timeZoneOptions(alias, WINTER).map((o) => o.value)).toContain(alias);
    expect(timeZoneOptions("Mars/Olympus_Mons", WINTER).map((o) => o.value)).not.toContain("Mars/Olympus_Mons");
  });
});
