import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create adapter
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Ensure plan catalog is present. Migrations seed these rows on first apply,
  // but running the seed on a database that predates the catalog (or after a
  // manual reset) should leave the four plans intact.
  const plans = [
    { code: 'FREE',     displayName: 'Free',     description: 'One published form.',                              maxPublishedForms: 1,    isPublic: true,  sortOrder: 10 },
    { code: 'HOSTING',  displayName: 'Hosting',  description: 'Hosting tier for self-hosted deployments.',        maxPublishedForms: 10,   isPublic: true,  sortOrder: 20 },
    { code: 'PAID',     displayName: 'Paid',     description: 'Unlimited published forms.',                       maxPublishedForms: null, isPublic: true,  sortOrder: 30 },
    { code: 'UNLOCKED', displayName: 'Unlocked', description: 'Internal / VIP accounts exempt from plan limits.', maxPublishedForms: null, isPublic: false, sortOrder: 99 },
  ];
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      create: plan,
      update: plan,
    });
  }
  console.log('✅ Plan catalog ensured');

  // Create admin user with account
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  let user;
  if (existingUser) {
    console.log(`ℹ️  Admin user already exists: ${existingUser.email}`);
    user = existingUser;
  } else {
    // Create account and user together. Fresh admin accounts are UNLOCKED so
    // the operator is never subject to the free-tier cap on their own
    // deployment.
    const account = await prisma.account.create({
      data: {
        planCode: 'UNLOCKED',
        user: {
          create: {
            email: adminEmail,
            password: hashedPassword,
          },
        },
      },
      include: {
        user: true,
      },
    });
    user = account.user!;
    console.log(`✅ Admin user created: ${user.email}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('⚠️  Make sure to change the admin password after first login!');
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
