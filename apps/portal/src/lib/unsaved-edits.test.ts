import { describe, expect, it } from "vitest";
import { clearUnsavedEdits, keepUnsavedEdits, outdatedEdits, unsavedEdits, UNSAVED_MAX_AGE_MS, type EditStorage } from "./unsaved-edits";

function memory(): EditStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

const NOW = 1_800_000_000_000;
/** Where the site stood when the edits were typed. */
const AT = "change-1:3:PENDING";

describe("edits the Editor couldn't send", () => {
  it("keeps them per site until they are cleared", () => {
    const s = memory();
    expect(unsavedEdits(s, "site-a", NOW, AT)).toEqual([]);
    expect(keepUnsavedEdits(s, "site-a", [{ address: "pages/home/hero/headline", value: "New" }], NOW, AT)).toBe(1);
    expect(unsavedEdits(s, "site-a", NOW, AT)).toEqual([{ address: "pages/home/hero/headline", value: "New" }]);
    expect(unsavedEdits(s, "site-b", NOW, AT)).toEqual([]);
    clearUnsavedEdits(s, "site-a");
    expect(unsavedEdits(s, "site-a", NOW, AT)).toEqual([]);
  });

  it("lets a later edit to a field replace the earlier one, in order of last change", () => {
    const s = memory();
    keepUnsavedEdits(s, "x", [{ address: "a", value: "1" }, { address: "b", value: "1" }], NOW, AT);
    expect(keepUnsavedEdits(s, "x", [{ address: "a", value: "2" }], NOW + 5, AT)).toBe(2);
    expect(unsavedEdits(s, "x", NOW + 5, AT)).toEqual([
      { address: "b", value: "1" },
      { address: "a", value: "2" },
    ]);
  });

  it("keeps a removal (a null value)", () => {
    const s = memory();
    keepUnsavedEdits(s, "x", [{ address: "announcements/a/endsOn", value: null }], NOW, AT);
    expect(unsavedEdits(s, "x", NOW, AT)).toEqual([{ address: "announcements/a/endsOn", value: null }]);
  });

  it("drops edits too old to trust, and starts over when a new one arrives", () => {
    const s = memory();
    keepUnsavedEdits(s, "x", [{ address: "a", value: "old" }], NOW, AT);
    const later = NOW + UNSAVED_MAX_AGE_MS + 1;
    expect(unsavedEdits(s, "x", later, AT)).toEqual([]);
    keepUnsavedEdits(s, "x", [{ address: "b", value: "new" }], later, AT);
    expect(unsavedEdits(s, "x", later, AT)).toEqual([{ address: "b", value: "new" }]);
  });

  it("reads nothing from storage it can't parse, and ignores entries of the wrong shape", () => {
    const s = memory();
    s.data.set("canopy:unsaved-edits:x", "not json");
    expect(unsavedEdits(s, "x", NOW, AT)).toEqual([]);
    s.data.set("canopy:unsaved-edits:x", JSON.stringify({ at: NOW, marker: AT, edits: [{ address: "a", value: "ok" }, { address: 3 }, null, { address: "b" }] }));
    expect(unsavedEdits(s, "x", NOW, AT)).toEqual([{ address: "a", value: "ok" }]);
  });

  it("stops offering edits once the site has moved since they were typed, and counts them (PRD D64)", () => {
    const s = memory();
    keepUnsavedEdits(s, "x", [{ address: "a", value: "mine" }, { address: "b", value: "mine too" }], NOW, AT);
    // Still where it stood: they are sent.
    expect(unsavedEdits(s, "x", NOW + 60_000, AT)).toHaveLength(2);
    expect(outdatedEdits(s, "x", NOW + 60_000, AT)).toBe(0);
    // Someone else edited: sending them would put old text over newer work.
    const moved = "change-1:4:PENDING";
    expect(unsavedEdits(s, "x", NOW + 60_000, moved)).toEqual([]);
    expect(outdatedEdits(s, "x", NOW + 60_000, moved)).toBe(2);
    // Too old is not outdated: those just lapse.
    expect(outdatedEdits(s, "x", NOW + UNSAVED_MAX_AGE_MS + 1, moved)).toBe(0);
  });

  it("starts over, never mixing in edits from where the site no longer stands", () => {
    const s = memory();
    keepUnsavedEdits(s, "x", [{ address: "a", value: "before" }], NOW, AT);
    const moved = "change-2:1:PENDING";
    expect(keepUnsavedEdits(s, "x", [{ address: "b", value: "after" }], NOW + 5, moved)).toBe(1);
    expect(unsavedEdits(s, "x", NOW + 5, moved)).toEqual([{ address: "b", value: "after" }]);
  });

  it("treats a stash with no marker as outdated: nothing says where the site stood", () => {
    const s = memory();
    s.data.set("canopy:unsaved-edits:x", JSON.stringify({ at: NOW, edits: [{ address: "a", value: "old page" }] }));
    expect(unsavedEdits(s, "x", NOW, AT)).toEqual([]);
    expect(outdatedEdits(s, "x", NOW, AT)).toBe(1);
  });

  it("keeps nothing, without throwing, when storage refuses", () => {
    const refusing: EditStorage = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };
    expect(keepUnsavedEdits(refusing, "x", [{ address: "a", value: "1" }], NOW, AT)).toBe(0);
    expect(unsavedEdits(refusing, "x", NOW, AT)).toEqual([]);
    expect(() => clearUnsavedEdits(refusing, "x")).not.toThrow();
  });
});
