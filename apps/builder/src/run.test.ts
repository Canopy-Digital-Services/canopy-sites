import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { failureFields, lastLines, run, StepError } from "./run.ts";

const env = { PATH: process.env.PATH ?? "/usr/bin:/bin" };

describe("a program that fails (Epic 46, H6)", () => {
  it("is named with its exit code for the portal, and keeps its last lines for the builder's log only", async () => {
    const failed = await run("sh", ["-c", "echo fetching; echo \"fatal: unable to access 'https://github.com/o/r.git/'\" >&2; exit 128"], {
      cwd: tmpdir(),
      env,
    }).catch((err: unknown) => err);
    expect(failed).toBeInstanceOf(StepError);
    expect((failed as StepError).message).toBe("sh -c exited with 128");
    expect((failed as StepError).output).toBe("fetching\nfatal: unable to access 'https://github.com/o/r.git/'");
    expect(failureFields(failed)).toEqual({
      message: "sh -c exited with 128",
      output: "fetching\nfatal: unable to access 'https://github.com/o/r.git/'",
    });
  });

  it("logs a failure with nothing written, or that isn't a program's, by its message alone", async () => {
    const silent = await run("sh", ["-c", "exit 1"], { cwd: tmpdir(), env }).catch((err: unknown) => err);
    expect(failureFields(silent)).toEqual({ message: "sh -c exited with 1" });
    expect(failureFields(new StepError("The site changed since this preview. Preview the change again."))).toEqual({
      message: "The site changed since this preview. Preview the change again.",
    });
    expect(failureFields(new Error("boom"))).toEqual({ message: "boom" });
  });
});

describe("lastLines", () => {
  it("keeps the last lines that say something, up to a length", () => {
    expect(lastLines("1\n\n2\n3\n  \n4\n5\n6\n")).toBe("2\n3\n4\n5\n6");
    expect(lastLines("x".repeat(3000))).toHaveLength(1000);
    expect(lastLines("")).toBe("");
  });
});
