import { describe, expect, it } from "vitest";
import { docsNavFor, getAllDocs } from "./docs";

const slugs = (sitesEnabled: boolean) => docsNavFor(sitesEnabled).flatMap((g) => [...g.slugs]);

describe("the help pages an account is shown", () => {
  it("leaves the pages about a website out for an account without Canopy Sites", () => {
    expect(slugs(true)).toContain("editing-together");
    expect(slugs(false)).not.toContain("editing-together");
    expect(docsNavFor(false).map((g) => g.group)).not.toContain("Your website");
  });

  it("shows a Sites account everything a Forms account sees", () => {
    for (const slug of slugs(false)) expect(slugs(true)).toContain(slug);
  });

  it("has a page behind every slug in the manifest", async () => {
    expect((await getAllDocs(true)).map((d) => d.slug)).toEqual(slugs(true));
    expect((await getAllDocs(false)).map((d) => d.slug)).toEqual(slugs(false));
  });
});
