/**
 * One-shot backfill: promote the ADMIN_EMAIL user to GLOBAL_ADMIN and move
 * their account to the UNLOCKED plan.
 *
 * Invoked from scripts/start.sh after `prisma migrate deploy` on every boot.
 * Idempotent: a user who is already GLOBAL_ADMIN (with an UNLOCKED account)
 * is left alone. If ADMIN_EMAIL is unset, or no user matches, the script
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
      select: { id: true, email: true, roleCode: true, accountId: true },
    });

    if (!user) {
      console.log(`[backfill-global-admin] No user matches ADMIN_EMAIL (${adminEmail}); skipping. Global Admin must be granted after the matching user signs up.`);
      return;
    }

    const account = await prisma.account.findUnique({
      where: { id: user.accountId },
      select: { planCode: true },
    });

    const alreadyAdmin = user.roleCode === 'GLOBAL_ADMIN';
    const alreadyUnlocked = account?.planCode === 'UNLOCKED';

    if (alreadyAdmin && alreadyUnlocked) {
      return;
    }

    await prisma.$transaction(async (tx) => {
      if (!alreadyAdmin) {
        await tx.user.update({
          where: { id: user.id },
          data: { roleCode: 'GLOBAL_ADMIN' },
        });
      }
      if (!alreadyUnlocked) {
        await tx.account.update({
          where: { id: user.accountId },
          data: { planCode: 'UNLOCKED' },
        });
      }
    });

    console.log(`[backfill-global-admin] Promoted ${user.email} to GLOBAL_ADMIN (plan -> UNLOCKED).`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[backfill-global-admin] Failed:', err);
  process.exit(1);
});
