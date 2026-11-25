import { describe, expect, it } from "vitest";
import { clock, isMp4, isWebVtt } from "./welcome-video-limits";

const bytes = (text: string) => new TextEncoder().encode(text);

describe("what a welcome video upload must be", () => {
  it("takes a file that starts with an ftyp box as an MP4", () => {
    expect(isMp4(Uint8Array.from([0, 0, 0, 32, ...bytes("ftypisom")]))).toBe(true);
    expect(isMp4(Uint8Array.from([0, 0, 0, 24, ...bytes("ftypmp42")]))).toBe(true);
  });

  it("refuses other files, and one too short to tell", () => {
    expect(isMp4(bytes("RIFF\0\0\0\0WEBP"))).toBe(false);
    expect(isMp4(bytes("ftypisom"))).toBe(false);
    expect(isMp4(Uint8Array.from([0, 0, 0, 32, ...bytes("fty")]))).toBe(false);
    expect(isMp4(new Uint8Array(0))).toBe(false);
  });

  it("takes a file that starts with WEBVTT as captions, with or without a byte order mark", () => {
    expect(isWebVtt("WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.000\nHi.\n")).toBe(true);
    expect(isWebVtt("\uFEFFWEBVTT\r\n")).toBe(true);
    expect(isWebVtt("WEBVTT - Welcome\n")).toBe(true);
    expect(isWebVtt("WEBVTT")).toBe(true);
  });

  it("refuses subtitles in another format", () => {
    expect(isWebVtt("1\n00:00:00,000 --> 00:00:02,000\nHi.\n")).toBe(false);
    expect(isWebVtt("WEBVTTX\n")).toBe(false);
    expect(isWebVtt(" WEBVTT\n")).toBe(false);
    expect(isWebVtt("")).toBe(false);
  });

  it("writes seconds as a player does", () => {
    expect(clock(0)).toBe("0:00");
    expect(clock(9.9)).toBe("0:09");
    expect(clock(252)).toBe("4:12");
    expect(clock(303)).toBe("5:03");
    expect(clock(3852)).toBe("1:04:12");
  });
});
