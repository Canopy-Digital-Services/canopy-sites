import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearRateLimit, isRateLimited, pruneRateLimits, resetRateLimits } from "./rate-limit";

const MIN = 60 * 1000;

beforeEach(() => {
  vi.useFakeTimers();
  resetRateLimits();
});
afterEach(() => vi.useRealTimers());

describe("isRateLimited", () => {
  it("allows max attempts in the window, then refuses", () => {
    for (let i = 0; i < 5; i++) expect(isRateLimited("k", 5, 15 * MIN)).toBe(false);
    expect(isRateLimited("k", 5, 15 * MIN)).toBe(true);
  });

  it("holds a 15-minute window across the periodic cleanup", () => {
    for (let i = 0; i < 5; i++) isRateLimited("k", 5, 15 * MIN);
    vi.advanceTimersByTime(11 * MIN);
    pruneRateLimits(); // what the 5-minute interval runs
    expect(isRateLimited("k", 5, 15 * MIN)).toBe(true);
  });

  it("frees up once the window has passed", () => {
    for (let i = 0; i < 5; i++) isRateLimited("k", 5, 15 * MIN);
    vi.advanceTimersByTime(15 * MIN + 1);
    expect(isRateLimited("k", 5, 15 * MIN)).toBe(false);
  });

  it("keeps keys apart, and clearRateLimit forgets one", () => {
    for (let i = 0; i < 5; i++) isRateLimited("a", 5, MIN);
    expect(isRateLimited("b", 5, MIN)).toBe(false);
    clearRateLimit("a");
    expect(isRateLimited("a", 5, MIN)).toBe(false);
  });
});
