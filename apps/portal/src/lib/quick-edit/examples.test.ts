import { describe, expect, it } from "vitest";
import { exampleRequests } from "./examples";

describe("Quick Edit's examples", () => {
  it("name a salon's real prices, hours, and a closure date (the demo's shape)", () => {
    const demo = {
      site: { hours: { kind: "weekly", days: [{ day: "tuesday", opens: "12:00", closes: "17:00" }, { day: "saturday", opens: "12:00", closes: "17:00" }] } },
      services: [{ id: "haircuts", name: "Haircuts", fromPriceLabel: "From $48", services: [{ id: "haircut", name: "Haircut", priceLabel: "$85" }] }],
      announcements: [],
    };
    // 2026-11-06 is a Friday: a week out is the 13th, and the first Saturday from there is the 14th.
    expect(exampleRequests(demo, "2026-11-06")).toEqual([
      "We're closed Saturday the 14th",
      "Raise the Haircut price to $90",
      "We're open until 6:00 PM on Saturdays now",
    ]);
  });

  it("name a gym's real class and coach (Toro Z's shape)", () => {
    const gym = {
      site: { hours: { kind: "freeform", text: "Open 7 days a week" } },
      classes: [
        {
          id: "fundamentals",
          name: "Muay Thai Fundamentals",
          sessions: [{ id: "weeknights", days: ["monday", "tuesday", "wednesday", "thursday", "friday"], starts: "19:00", ends: "20:00" }],
        },
      ],
      team: [{ id: "iggy", name: "Coach Iggy" }],
    };
    expect(exampleRequests(gym, "2026-11-06")).toEqual([
      "Muay Thai Fundamentals is moving to 7:30 to 8:30 PM on weekdays",
      "Update our hours",
      "Update Coach Iggy's bio",
    ]);
  });

  it("skip prices that aren't a plain amount, and spell out days and noon crossings", () => {
    const content = {
      services: [{ id: "a", name: "Color", services: [{ id: "c", name: "Color", priceLabel: "From $150" }] }],
      classes: [{ id: "bjj", name: "Community BJJ", shortName: "BJJ", sessions: [{ id: "s", days: ["sunday"], starts: "11:15", ends: "12:30" }] }],
      faqs: [{ id: "walk-ins", question: "Do you take walk-ins?", answer: "Yes." }],
    };
    expect(exampleRequests(content, "2026-11-06")).toEqual([
      "BJJ is moving to 11:45 AM to 1:00 PM on Sundays",
      'Change the answer to "Do you take walk-ins?"',
    ]);
  });

  it("offer nothing for a site with none of these", () => {
    expect(exampleRequests({ site: {}, pages: [] }, "2026-11-06")).toEqual([]);
  });
});
