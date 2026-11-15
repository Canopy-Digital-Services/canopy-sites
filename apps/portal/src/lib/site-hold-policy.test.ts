import { describe, expect, it } from "vitest";
import { IDLE_AFTER_MS, isActivityMessage, shouldKeep, wasIdle } from "./site-hold-policy";

const now = 1_800_000_000_000;

describe("when a page keeps the site's hold (PRD D64)", () => {
  it("keeps it while its person is active, in view or not", () => {
    expect(shouldKeep({ now, lastActive: now - 1000, waiting: false, visible: true })).toBe(true);
    // In another tab, copying something to paste in: still editing.
    expect(shouldKeep({ now, lastActive: now - 5 * 60_000, waiting: false, visible: false })).toBe(true);
  });

  it("stops after ten minutes without a key or a pointer, so the site frees itself", () => {
    expect(shouldKeep({ now, lastActive: now - IDLE_AFTER_MS + 1, waiting: false, visible: true })).toBe(true);
    expect(shouldKeep({ now, lastActive: now - IDLE_AFTER_MS, waiting: false, visible: true })).toBe(false);
    expect(wasIdle(now, now - IDLE_AFTER_MS)).toBe(true);
    expect(wasIdle(now, now - IDLE_AFTER_MS + 1)).toBe(false);
  });

  it("lets a page waiting its turn take the site only while it is in view and its person is there", () => {
    expect(shouldKeep({ now, lastActive: now - 1000, waiting: true, visible: true })).toBe(true);
    expect(shouldKeep({ now, lastActive: now - 1000, waiting: true, visible: false })).toBe(false);
    expect(shouldKeep({ now, lastActive: now - IDLE_AFTER_MS, waiting: true, visible: true })).toBe(false);
  });

  it("counts what a person does inside the site's frame, and not the frame settling", () => {
    for (const type of ["select", "input", "scroll", "commit", "navigate"]) {
      expect(isActivityMessage({ source: "canopy-canvas", type })).toBe(true);
    }
    for (const type of ["ready", "rect", "restored"]) {
      expect(isActivityMessage({ source: "canopy-canvas", type })).toBe(false);
    }
    expect(isActivityMessage({ source: "something-else", type: "input" })).toBe(false);
    expect(isActivityMessage(null)).toBe(false);
    expect(isActivityMessage("input")).toBe(false);
  });
});
