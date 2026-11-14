import { describe, expect, it } from "vitest";
import { dateIn, datesEnding, startOfDayIn } from "./range";

const LA = "America/Los_Angeles";

describe("dateIn and datesEnding", () => {
  it("reads today in the zone, not in UTC", () => {
    const evening = new Date("2026-11-14T05:30:00Z"); // 21:30 on the 13th in Los Angeles
    expect(dateIn(LA, evening)).toBe("2026-11-13");
    expect(dateIn("UTC", evening)).toBe("2026-11-14");
  });

  it("lists consecutive dates ending today in the zone, across the end of daylight time", () => {
    expect(datesEnding(new Date("2026-11-03T07:00:00Z"), 4, LA)).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
  });
});

describe("startOfDayIn", () => {
  it.each([
    ["2026-11-14", LA, "2026-11-14T08:00:00.000Z"], // standard time, UTC-8
    ["2026-07-04", LA, "2026-07-04T07:00:00.000Z"], // daylight time, UTC-7
    ["2026-11-01", LA, "2026-11-01T07:00:00.000Z"], // the day daylight time ends, at 02:00
    ["2026-03-08", LA, "2026-03-08T08:00:00.000Z"], // the day it starts
    ["2026-11-14", "Asia/Kolkata", "2026-11-13T18:30:00.000Z"],
    ["2026-11-14", "UTC", "2026-11-14T00:00:00.000Z"],
  ])("%s begins in %s at %s", (date, zone, instant) => {
    expect(startOfDayIn(date, zone).toISOString()).toBe(instant);
  });
});
