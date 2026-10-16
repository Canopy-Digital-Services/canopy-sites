/**
 * One-shot backfill: promote the ADMIN_EMAIL user to GLOBAL_ADMIN and, when
 * their account's plan caps published forms, move it to PAID (Unlimited). The same
 * rule as setUserRole: an uncapped plan stays, so a SITES account keeps Sites.
 *
 * Invoked from scripts/start.sh after `prisma migrate deploy` on every boot.
 * Idempotent: a GLOBAL_ADMIN on an uncapped plan is left alone. If ADMIN_EMAIL is unset, or no user matches, the script
 * logs a warning and exits 0 so the container still starts.
 *
 * This is intentionally plain ESM (not TypeScript) so it runs in the
 * production container without a compile step or tsx.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

async function main() {
  const adminEmailRaw = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmailRaw) {
    console.log('[backfill-global-admin] ADMIN_EMAIL not set; skipping. Promote a user via the operator console after first signup.');
    return;
  }
  const adminEmail = adminEmailRaw.toLowerCase();

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: adminEmail, mode: 'insensitive' } },
      select: { id: true, email: true, roleCode: true },
    });

    if (!user) {
      console.log(`[backfill-global-admin] No user matches ADMIN_EMAIL (${adminEmail}); skipping. Global Admin must be granted after the matching user signs up.`);
      return;
    }

    // v1: one membership per user; that account is the one to unlock.
    const memberships = await prisma.membership.findMany({
      where: { userId: user.id },
      select: {
        account: { select: { id: true, planCode: true, plan: { select: { maxPublishedForms: true } } } },
      },
      take: 2,
    });
    if (memberships.length !== 1) {
      console.log(`[backfill-global-admin] ${user.email} has ${memberships.length} account memberships; expected 1. Skipping.`);
      return;
    }
    const account = memberships[0].account;

    const alreadyAdmin = user.roleCode === 'GLOBAL_ADMIN';
    const needsUnlock = account.plan.maxPublishedForms !== null;

    if (alreadyAdmin && !needsUnlock) {
      return;
    }

    await prisma.$transaction(async (tx) => {
      if (!alreadyAdmin) {
        await tx.user.update({
          where: { id: user.id },
          data: { roleCode: 'GLOBAL_ADMIN' },
        });
      }
      if (needsUnlock) {
        await tx.account.update({
          where: { id: account.id },
          data: { planCode: 'PAID' },
        });
      }
    });

    const planNote = needsUnlock ? 'plan -> PAID' : `plan ${account.planCode} kept`;
    console.log(`[backfill-global-admin] ${user.email} is GLOBAL_ADMIN (${planNote}).`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[backfill-global-admin] Failed:', err);
  process.exit(1);
});
