import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { resetDatabase } from "../../test/db";

vi.mock("@/lib/auth", () => ({ auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }));

const { signUp } = await import("./auth");

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(resetDatabase);

describe("signUp", () => {
  it("creates the user, a FREE account, and an OWNER membership linking them", async () => {
    const result = await signUp(form({ email: "New@Example.com ", password: "long-enough-pw" }));
    expect(result).toEqual({ success: true });

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "new@example.com" },
      include: { memberships: { include: { account: true } } },
    });
    expect(user.memberships).toHaveLength(1);
    expect(user.memberships[0]).toMatchObject({ role: "OWNER", account: { planCode: "FREE" } });
    expect(user.password).not.toBe("long-enough-pw");
  });

  it("rejects a registered email without creating anything", async () => {
    await signUp(form({ email: "taken@example.com", password: "long-enough-pw" }));
    const result = await signUp(form({ email: "taken@example.com", password: "another-pw-1" }));

    expect(result).toEqual({ error: "Email already registered" });
    expect(await prisma.account.count()).toBe(1);
  });
});
