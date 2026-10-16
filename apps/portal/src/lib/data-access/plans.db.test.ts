import { describe, expect, it } from "vitest";
import { listPlans } from "./plans";

describe("plan catalog (seeded by migration)", () => {
  it("is Free, Unlimited, and Sites, with Canopy Sites on SITES only", async () => {
    const plans = await listPlans();
    expect(plans.map((p) => [p.code, p.displayName, p.sitesEnabled, p.maxPublishedForms])).toEqual([
      ["FREE", "Free", false, 1],
      ["PAID", "Unlimited", false, null],
      ["SITES", "Sites", true, null],
    ]);
  });
});
