import { describe, expect, it } from "vitest";
import { clearUnsavedEdits, keepUnsavedEdits, unsavedEdits, UNSAVED_MAX_AGE_MS, type EditStorage } from "./unsaved-edits";

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

describe("edits the Editor couldn't send", () => {
  it("keeps them per site until they are cleared", () => {
    const s = memory();
    expect(unsavedEdits(s, "site-a", NOW)).toEqual([]);
    expect(keepUnsavedEdits(s, "site-a", [{ address: "pages/home/hero/headline", value: "New" }], NOW)).toBe(1);
    expect(unsavedEdits(s, "site-a", NOW)).toEqual([{ address: "pages/home/hero/headline", value: "New" }]);
    expect(unsavedEdits(s, "site-b", NOW)).toEqual([]);
    clearUnsavedEdits(s, "site-a");
    expect(unsavedEdits(s, "site-a", NOW)).toEqual([]);
  });

  it("lets a later edit to a field replace the earlier one, in order of last change", () => {
    const s = memory();
    keepUnsavedEdits(s, "x", [{ address: "a", value: "1" }, { address: "b", value: "1" }], NOW);
    expect(keepUnsavedEdits(s, "x", [{ address: "a", value: "2" }], NOW + 5)).toBe(2);
    expect(unsavedEdits(s, "x", NOW + 5)).toEqual([
      { address: "b", value: "1" },
      { address: "a", value: "2" },
    ]);
  });

  it("keeps a removal (a null value)", () => {
    const s = memory();
    keepUnsavedEdits(s, "x", [{ address: "announcements/a/endsOn", value: null }], NOW);
    expect(unsavedEdits(s, "x", NOW)).toEqual([{ address: "announcements/a/endsOn", value: null }]);
  });

  it("drops edits too old to trust, and starts over when a new one arrives", () => {
    const s = memory();
    keepUnsavedEdits(s, "x", [{ address: "a", value: "old" }], NOW);
    const later = NOW + UNSAVED_MAX_AGE_MS + 1;
    expect(unsavedEdits(s, "x", later)).toEqual([]);
    keepUnsavedEdits(s, "x", [{ address: "b", value: "new" }], later);
    expect(unsavedEdits(s, "x", later)).toEqual([{ address: "b", value: "new" }]);
  });

  it("reads nothing from storage it can't parse, and ignores entries of the wrong shape", () => {
    const s = memory();
    s.data.set("canopy:unsaved-edits:x", "not json");
    expect(unsavedEdits(s, "x", NOW)).toEqual([]);
    s.data.set("canopy:unsaved-edits:x", JSON.stringify({ at: NOW, edits: [{ address: "a", value: "ok" }, { address: 3 }, null, { address: "b" }] }));
    expect(unsavedEdits(s, "x", NOW)).toEqual([{ address: "a", value: "ok" }]);
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
    expect(keepUnsavedEdits(refusing, "x", [{ address: "a", value: "1" }], NOW)).toBe(0);
    expect(unsavedEdits(refusing, "x", NOW)).toEqual([]);
    expect(() => clearUnsavedEdits(refusing, "x")).not.toThrow();
  });
});
