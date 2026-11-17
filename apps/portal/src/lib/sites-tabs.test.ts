import { describe, expect, it } from "vitest";
import { isSitesTab, sitesTabLabel, sitesTabOf } from "./sites-tabs";

describe("the Sites portal's tabs", () => {
  it("finds the tab a page is on, its own page or one under it", () => {
    expect(sitesTabOf("/quick-edit")).toBe("quick-edit");
    expect(sitesTabOf("/editor")).toBe("editor");
    expect(sitesTabOf("/forms/abc123/submissions")).toBe("forms");
    expect(sitesTabOf("/stats")).toBe("stats");
  });

  it("finds none for a page no tab holds, or one that only starts like a tab's", () => {
    expect(sitesTabOf("/account")).toBeNull();
    expect(sitesTabOf("/docs/forms")).toBeNull();
    expect(sitesTabOf("/editorial")).toBeNull();
    expect(sitesTabOf("/")).toBeNull();
  });

  it("knows a tab's id from anything else a request might send", () => {
    expect(isSitesTab("quick-edit")).toBe(true);
    expect(isSitesTab("Quick Edit")).toBe(false);
    expect(isSitesTab("account")).toBe(false);
    expect(isSitesTab({ id: "forms" })).toBe(false);
    expect(isSitesTab(undefined)).toBe(false);
    expect(sitesTabLabel("quick-edit")).toBe("Quick Edit");
  });
});
