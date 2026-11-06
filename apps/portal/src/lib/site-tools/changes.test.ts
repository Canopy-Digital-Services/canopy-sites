import { describe, expect, it } from "vitest";
import { changedFields } from "./changes";

type Session = { id: string; days: string[]; starts: string; ends: string };
type Cls = { id: string; name: string; description: string; sessions?: Session[] };

const CLASSES: Cls[] = [
  {
    id: "fundamentals",
    name: "Muay Thai Fundamentals",
    description: "Where most people start.",
    sessions: [{ id: "weeknights", days: ["monday", "friday"], starts: "19:00", ends: "20:00" }],
  },
  { id: "conditioning", name: "Conditioning", description: "No fighting required." },
];

describe("changedFields", () => {
  it("names each changed field under the entry it belongs to", () => {
    const after = structuredClone(CLASSES);
    after[0].sessions![0].starts = "19:30";
    after[1].description = "Get in shape.";
    expect(changedFields({ classes: CLASSES }, { classes: after }).map((c) => c.text)).toEqual([
      'Muay Thai Fundamentals (Mon, Fri 19:00 to 20:00): Starts: "19:00" to "19:30"',
      'Conditioning: Description: "No fighting required." to "Get in shape."',
    ]);
  });

  it("reports entries added, removed, and reordered, without listing their insides", () => {
    const after = structuredClone(CLASSES).reverse();
    after[1].sessions!.push({ id: "saturday", days: ["saturday"], starts: "09:00", ends: "10:00" });
    const team = [{ id: "iggy", name: "Coach Iggy", role: "Head Coach" }];
    expect(changedFields({ classes: CLASSES, team }, { classes: after, team: [] }).map((c) => [c.kind, c.text])).toEqual([
      ["added", 'Added "Sat 09:00 to 10:00" to Muay Thai Fundamentals: Sessions'],
      ["reordered", "Reordered Classes"],
      ["removed", 'Removed "Coach Iggy" from Team'],
    ]);
  });

  it("tells a field set from one cleared, and treats a list of plain values as one value", () => {
    const before = { site: { name: "Toro Z", description: "A gym.", tagline: "Oak Park." } };
    const after = { site: { name: "Toro Z", description: "A gym.", hours: { kind: "freeform", text: "Open 7 days a week" } } };
    expect(changedFields(before, after).map((c) => [c.kind, c.text])).toEqual([
      ["cleared", 'Tagline: cleared (was "Oak Park.")'],
      ["set", 'Hours: set to "{"kind":"freeform","text":"Open 7 days a week"}"'],
    ]);
    const days = structuredClone(CLASSES);
    days[0].sessions![0].days = ["monday", "wednesday", "friday"];
    expect(changedFields({ classes: CLASSES }, { classes: days })[0]).toMatchObject({
      kind: "changed",
      label: "Muay Thai Fundamentals (Mon, Fri 19:00 to 20:00): Days",
      after: '["monday","wednesday","friday"]',
    });
  });

  it("reports nothing when nothing changed", () => {
    expect(changedFields({ classes: CLASSES }, { classes: structuredClone(CLASSES) })).toEqual([]);
  });
});
