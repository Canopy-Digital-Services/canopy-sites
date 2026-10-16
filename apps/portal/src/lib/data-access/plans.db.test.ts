import { describe, expect, it } from "vitest";
import { listPlans } from "./plans";

describe("plan catalog (seeded by migration)", () => {
  it("gives Canopy Sites to SITES only; UNLOCKED means no Forms limits, not Sites", async () => {
    const plans = await listPlans();
    expect(plans.map((p) => [p.code, p.sitesEnabled, p.maxPublishedForms])).toEqual([
      ["FREE", false, 1],
      ["HOSTING", false, 10],
      ["PAID", false, null],
      ["SITES", true, null],
      ["UNLOCKED", false, null],
    ]);
  });
});
