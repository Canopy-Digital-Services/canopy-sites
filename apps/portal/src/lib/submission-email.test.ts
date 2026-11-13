import { afterEach, describe, expect, it } from "vitest";
import { renderNotificationEmail } from "./submission-email";

/** 4:20 PM Pacific on Nov 12, which is already Nov 13 in UTC. */
const SUBMITTED_AT = new Date("2026-11-13T00:20:05Z");

function render(opts: { timeZone?: string | null; submittedAt?: Date; responses?: boolean } = {}) {
  return renderNotificationEmail({
    formName: "Contact",
    submittedAt: opts.submittedAt ?? SUBMITTED_AT,
    submissionsUrl: null,
    responses: opts.responses ? [{ label: "Name", value: "Ada" }] : null,
    productName: "Canopy Forms",
    timeZone: opts.timeZone,
  });
}

describe("renderNotificationEmail: the submission's time", () => {
  const serverZone = process.env.TZ;
  afterEach(() => {
    if (serverZone === undefined) delete process.env.TZ;
    else process.env.TZ = serverZone;
  });

  it("is written in the site's zone, with the zone named", () => {
    expect(render({ timeZone: "America/Los_Angeles" }).text).toContain("Date: Nov 12, 2026, 4:20 PM PST\n");
    expect(render({ timeZone: "America/New_York" }).text).toContain("Date: Nov 12, 2026, 7:20 PM EST\n");
  });

  it("names daylight time when the site's zone is on it", () => {
    const july = new Date("2026-07-04T19:05:00Z");
    expect(render({ timeZone: "America/Los_Angeles", submittedAt: july }).text).toContain("Date: Jul 4, 2026, 12:05 PM PDT\n");
  });

  it("is written in UTC, named, for an account with no site", () => {
    expect(render({ timeZone: null }).text).toContain("Date: Nov 13, 2026, 12:20 AM UTC\n");
    expect(render().text).toContain("Date: Nov 13, 2026, 12:20 AM UTC\n");
  });

  it("falls back to UTC for a zone the runtime doesn't know", () => {
    expect(render({ timeZone: "Mars/Olympus_Mons" }).text).toContain("Date: Nov 13, 2026, 12:20 AM UTC\n");
  });

  it("doesn't follow the server's own zone", () => {
    process.env.TZ = "Asia/Tokyo";
    // Guards the test itself: the runtime has to have picked the change up.
    expect(new Date(SUBMITTED_AT).getHours()).toBe(9);

    expect(render({ timeZone: null }).text).toContain("Date: Nov 13, 2026, 12:20 AM UTC\n");
    expect(render({ timeZone: "America/Los_Angeles" }).text).toContain("Date: Nov 12, 2026, 4:20 PM PST\n");
  });

  it("reads the same in the HTML part", () => {
    const { text, html } = render({ timeZone: "America/Los_Angeles", responses: true });
    expect(text).toContain("Date: Nov 12, 2026, 4:20 PM PST\n");
    expect(html).toContain(">Nov 12, 2026, 4:20 PM PST</div>");
  });

  it("uses plain spaces only, which every mail client draws", () => {
    const { text, html } = render({ timeZone: "America/Los_Angeles", responses: true });
    expect(text).not.toMatch(/[  ]/);
    expect(html).not.toMatch(/[  ]/);
  });
});
