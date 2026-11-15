import { describe, expect, it } from "vitest";
import { parseRange } from "./byte-range";

describe("parseRange", () => {
  it("gives the bytes asked for, clamped to the file", () => {
    expect(parseRange("bytes=0-1", 1000)).toEqual({ start: 0, end: 1 });
    expect(parseRange("bytes=100-199", 1000)).toEqual({ start: 100, end: 199 });
    expect(parseRange("bytes=100-", 1000)).toEqual({ start: 100, end: 999 });
    expect(parseRange("bytes=900-5000", 1000)).toEqual({ start: 900, end: 999 });
    expect(parseRange(" bytes=999-999 ", 1000)).toEqual({ start: 999, end: 999 });
  });

  it("gives the last bytes for a suffix", () => {
    expect(parseRange("bytes=-100", 1000)).toEqual({ start: 900, end: 999 });
    expect(parseRange("bytes=-5000", 1000)).toEqual({ start: 0, end: 999 });
  });

  it("refuses a range that starts past the end, or asks for nothing", () => {
    expect(parseRange("bytes=1000-", 1000)).toBe("unsatisfiable");
    expect(parseRange("bytes=1000-2000", 1000)).toBe("unsatisfiable");
    expect(parseRange("bytes=-0", 1000)).toBe("unsatisfiable");
    expect(parseRange("bytes=0-", 0)).toBe("unsatisfiable");
    expect(parseRange(`bytes=${"9".repeat(40)}-`, 1000)).toBe("unsatisfiable");
  });

  it("gives the whole file for no range, several, or one it can't read", () => {
    for (const header of [null, "", "bytes=-", "bytes=0-1,5-9", "items=0-1", "bytes=5-2", "bytes=a-b", "bytes=1.5-2", "bytes=-1-2"]) {
      expect(parseRange(header, 1000), String(header)).toBeNull();
    }
  });
});
