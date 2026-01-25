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
    // Create account and user together
    const account = await prisma.account.create({
      data: {
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
