import { describe, expect, it } from "vitest";
import { OUT_OF_LANE, proposalResult, systemPrompt } from "./index";
import { BASE_RUNBOOK } from "./runbook";

describe("the system prompt", () => {
  it("is the base runbook, then the site's guide and its collections, then the date", () => {
    const [base, site, today] = systemPrompt({ name: "Toro Z Muay Thai", guide: "## Exact names\n\n- Coach Iggy" }, ["site", "classes"], "2026-11-06");
    expect(base.text).toBe(BASE_RUNBOOK);
    expect(site.text.startsWith("# This site: Toro Z Muay Thai\n\n## Exact names\n\n- Coach Iggy\n\n# Collections\n\n## site (Business details)\n")).toBe(true);
    expect(site.text).toContain("## classes (Classes)\n");
    expect(site.cache_control).toEqual({ type: "ephemeral" });
    expect(today.text).toBe("Today is 2026-11-06.");
  });

  it("says so when a site has no guide", () => {
    expect(systemPrompt({ name: "Demo", guide: "  " }, ["site"], "2026-11-06")[1].text).toContain("(This site has no guide yet.)");
  });

  it("keeps owner copy verbatim and sends what's Canopy's to Michael (PRD D32, D34)", () => {
    expect(BASE_RUNBOOK).not.toMatch(/match the site's existing tone/i);
    expect(BASE_RUNBOOK).toContain("Never write copy.");
    expect(BASE_RUNBOOK).toContain("request_help");
    expect(BASE_RUNBOOK).not.toContain("—");
    expect(OUT_OF_LANE).toContain("request_help");
  });
});

describe("a proposal's result", () => {
  it("lists what changed and what the copy avoids, and asks the model to check both", () => {
    const text = proposalResult({
      summary: "Conditioning to 6:30",
      changes: [{ address: "classes/conditioning/sessions/weeknights/starts", kind: "changed", label: "Conditioning (Mon 18:00 to 19:00): Starts", before: "18:00", after: "18:30", text: 'Conditioning (Mon 18:00 to 19:00): Starts: "18:00" to "18:30"' }],
      warnings: [{ address: "classes/conditioning/description", collection: "classes", path: "/4/description", label: "Description", message: "Description has an em dash, which this site's copy avoids" }],
    });
    expect(text).toContain("Proposed: Conditioning to 6:30.");
    expect(text).toContain('- Conditioning (Mon 18:00 to 19:00): Starts: "18:00" to "18:30"');
    expect(text).toContain("Check this list against what the owner asked for.");
    expect(text).toContain("- Description has an em dash, which this site's copy avoids");
  });
});
