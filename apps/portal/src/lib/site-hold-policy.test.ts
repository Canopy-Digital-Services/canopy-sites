import { describe, expect, it } from "vitest";
import { draftNotice, editingNotice, IDLE_AFTER_MS, isActivityMessage, shouldAsk, theirChanges, wasIdle } from "./site-hold-policy";

const now = 1_800_000_000_000;

describe("how an editing page follows the site's hold (PRD D64)", () => {
  it("asks for the person who has the site while they are active, in view or not", () => {
    expect(shouldAsk({ now, lastActive: now - 1000, holding: true, visible: true })).toBe(true);
    // In another tab, copying something to paste in: still editing, and asking is what keeps their hold.
    expect(shouldAsk({ now, lastActive: now - 5 * 60_000, holding: true, visible: false })).toBe(true);
  });

  it("stops after ten minutes without a key or a pointer, so a hold runs out under a person who has gone quiet", () => {
    expect(shouldAsk({ now, lastActive: now - IDLE_AFTER_MS + 1, holding: true, visible: true })).toBe(true);
    expect(shouldAsk({ now, lastActive: now - IDLE_AFTER_MS, holding: true, visible: true })).toBe(false);
    expect(wasIdle(now, now - IDLE_AFTER_MS)).toBe(true);
    expect(wasIdle(now, now - IDLE_AFTER_MS + 1)).toBe(false);
  });

  it("asks for anyone else only while their page is in view and they are there", () => {
    expect(shouldAsk({ now, lastActive: now - 1000, holding: false, visible: true })).toBe(true);
    expect(shouldAsk({ now, lastActive: now - 1000, holding: false, visible: false })).toBe(false);
    expect(shouldAsk({ now, lastActive: now - IDLE_AFTER_MS, holding: false, visible: true })).toBe(false);
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

  it("has one wording for who has the site, and for a draft someone else last changed", () => {
    expect(editingNotice("Jane Doe")).toBe("Jane Doe is currently making edits");
    expect(theirChanges("Jane Doe")).toBe("Jane Doe's unpublished changes");
    expect(draftNotice("Jane Doe")).toBe("Jane Doe has unpublished changes");
  });
});
