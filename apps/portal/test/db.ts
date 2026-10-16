import { prisma } from "@/lib/db";
import { assertTestDatabase } from "./db-url";

/** Seeded by migrations, so a reset keeps them. */
const CATALOG_TABLES = ["_prisma_migrations", "plans", "roles"];

/** Empties every table except the migration-seeded catalogs. Call in `beforeEach`. */
export async function resetDatabase() {
  assertTestDatabase(process.env.DATABASE_URL);
  const rows = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
  const tables = rows
    .map((r) => r.tablename)
    .filter((t) => !CATALOG_TABLES.includes(t))
    .map((t) => `"${t}"`);
  if (tables.length) await prisma.$executeRawUnsafe(`TRUNCATE ${tables.join(", ")} CASCADE`);
}

let seq = 0;

/** An account with one OWNER, the shape signup creates. */
export async function createAccount(opts: { planCode?: string; roleCode?: string } = {}) {
  seq += 1;
  const account = await prisma.account.create({ data: { planCode: opts.planCode ?? "FREE" } });
  const user = await createMember(account.id, "OWNER", { roleCode: opts.roleCode });
  return { account, user };
}

/** A new user with a membership on an existing account. */
export async function createMember(
  accountId: string,
  role: "OWNER" | "MEMBER" = "MEMBER",
  opts: { roleCode?: string } = {}
) {
  seq += 1;
  return prisma.user.create({
    data: {
      email: `user${seq}@test.invalid`,
      password: "not-a-real-hash",
      roleCode: opts.roleCode ?? "USER",
      memberships: { create: { accountId, role } },
    },
  });
}

/** A form on the account, created by its user. */
export async function createForm(accountId: string, userId: string, opts: { published?: boolean } = {}) {
  seq += 1;
  return prisma.form.create({
    data: {
      accountId,
      createdByUserId: userId,
      name: `Form ${seq}`,
      slug: `form-${seq}`,
      type: "HOSTED",
      published: opts.published ?? false,
    },
  });
}
