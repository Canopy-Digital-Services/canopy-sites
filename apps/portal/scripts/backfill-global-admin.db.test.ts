import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createAccount, resetDatabase } from "../test/db";

const script = fileURLToPath(new URL("./backfill-global-admin.mjs", import.meta.url));

/** Runs the boot-time backfill as start.sh does, against the test database. */
function runBackfill(adminEmail: string) {
  return execFileSync(process.execPath, [script], {
    env: { ...process.env, ADMIN_EMAIL: adminEmail },
    encoding: "utf8",
  });
}

beforeEach(resetDatabase);

describe("backfill-global-admin", () => {
  it("promotes the ADMIN_EMAIL user and lifts a capped plan to UNLOCKED", async () => {
    const { account, user } = await createAccount({ planCode: "FREE" });

    runBackfill(user.email);

    expect(await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).toMatchObject({ roleCode: "GLOBAL_ADMIN" });
    expect(await prisma.account.findUniqueOrThrow({ where: { id: account.id } })).toMatchObject({ planCode: "UNLOCKED" });
  });

  it("leaves an admin's SITES account alone on every boot, so Sites survives a deploy", async () => {
    const { account, user } = await createAccount({ planCode: "SITES", roleCode: "GLOBAL_ADMIN" });

    runBackfill(user.email);

    expect(await prisma.account.findUniqueOrThrow({ where: { id: account.id } })).toMatchObject({ planCode: "SITES" });
  });
});
