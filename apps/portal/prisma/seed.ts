import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { hashPassword } from '../src/lib/password';

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
  // manual reset) should leave the plans intact.
  const plans = [
    { code: 'FREE',  displayName: 'Free',      description: 'One published form.',                                     maxPublishedForms: 1,    sitesEnabled: false, isPublic: true,  sortOrder: 10 },
    { code: 'PAID',  displayName: 'Unlimited', description: 'Unlimited published forms.',                              maxPublishedForms: null, sitesEnabled: false, isPublic: true,  sortOrder: 30 },
    { code: 'SITES', displayName: 'Sites',     description: 'A Canopy Sites website, plus unlimited published forms.', maxPublishedForms: null, sitesEnabled: true,  isPublic: false, sortOrder: 40 },
  ];
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      create: plan,
      update: plan,
    });
  }
  console.log('✅ Plan catalog ensured');

  // Ensure role catalog is present. Same upsert pattern as plans.
  const roles = [
    { code: 'USER',         displayName: 'User',         description: 'Standard account holder.',                             isPublic: true,  sortOrder: 10 },
    { code: 'GLOBAL_ADMIN', displayName: 'Global Admin', description: 'Full operator-console access; a plan with a form limit moves to Unlimited.', isPublic: false, sortOrder: 90 },
  ];
  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      create: role,
      update: role,
    });
  }
  console.log('✅ Role catalog ensured');

  // Create admin user with account
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const hashedPassword = await hashPassword(adminPassword);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  let user;
  if (existingUser) {
    console.log(`ℹ️  Admin user already exists: ${existingUser.email}`);
    user = existingUser;
  } else {
    // Create account and user together. Fresh admin accounts are Unlimited (PAID) so
    // the operator is never subject to the free-tier cap on their own
    // deployment, and the bootstrap user lands with the GLOBAL_ADMIN role so
    // they can access the operator console immediately.
    user = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        roleCode: 'GLOBAL_ADMIN',
        memberships: {
          create: { role: 'OWNER', account: { create: { planCode: 'PAID' } } },
        },
      },
    });
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
