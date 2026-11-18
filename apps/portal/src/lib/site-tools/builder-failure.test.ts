import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { BuilderError } from "@/lib/builder-client";
import { BUILDER_FAILED, builderFailure } from "./builder-failure";

describe("a builder failure (Epic 46, H6)", () => {
  let logged: MockInstance<typeof console.error>;
  beforeEach(() => {
    logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => logged.mockRestore());

  it("becomes a plain sentence for the owner, with the builder's message in one log line with the site", () => {
    const said = builderFailure("read", new BuilderError("git fetch exited with 128"), { slug: "hair-and-harvest" });
    expect(said).toBe("Your site couldn't be loaded just now. Try again in a moment.");
    expect(logged).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(logged.mock.calls[0][0]))).toEqual({
      event: "builder_read_failed",
      slug: "hair-and-harvest",
      message: "git fetch exited with 128",
    });
  });

  it("logs each step under its own event, with the ids it is given", () => {
    builderFailure("preview", new BuilderError("The site builder didn't respond (TimeoutError)."), { slug: "demo", buildId: "b1" });
    builderFailure("publish", new BuilderError("git push exited with 128"), { slug: "demo", changeSetId: "c1" });
    expect(logged.mock.calls.map(([line]) => JSON.parse(String(line)))).toEqual([
      { event: "builder_preview_failed", slug: "demo", buildId: "b1", message: "The site builder didn't respond (TimeoutError)." },
      { event: "builder_publish_failed", slug: "demo", changeSetId: "c1", message: "git push exited with 128" },
    ]);
  });

  it("never tells the owner about git, the builder, or an exit code", () => {
    for (const sentence of Object.values(BUILDER_FAILED)) {
      expect(sentence).not.toMatch(/git|builder|exited|\d|[–—]/i);
    }
  });
});
