import { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

const prisma = new PrismaClient();

const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'AGENT_CONTROLE',
      },
    },
  },
});

async function main() {
  console.log('🚀 Seeding all test users...\n');

  const users = [
    {
      email: 'admin@test.com',
      password: 'admin123',
      name: 'Admin Test',
      role: 'admin',
    },
    {
      email: 'direction@test.com',
      password: 'direction123',
      name: 'Direction Test',
      role: 'direction',
    },
  ];

  for (const userData of users) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`⏭️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Create user via BetterAuth
      console.log(`📝 Creating user: ${userData.email}...`);
      const result = await auth.api.signUpEmail({
        body: {
          email: userData.email,
          password: userData.password,
          name: userData.name,
        },
      });

      if (result) {
        // Update role
        await prisma.user.update({
          where: { email: userData.email },
          data: { role: userData.role },
        });

        console.log(`✅ Created: ${userData.email}`);
        console.log(`   Password: ${userData.password}`);
        console.log(`   Role: ${userData.role}\n`);
      }
    } catch (error) {
      console.error(`❌ Error creating ${userData.email}:`, error);
    }
  }

  console.log('\n📋 Test Credentials:');
  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│ Email                      Password            │');
  console.log('├─────────────────────────────────────────────────┤');
  users.forEach(user => {
    console.log(`│ ${user.email.padEnd(26)} ${user.password.padEnd(18)} │`);
  });
  console.log('└─────────────────────────────────────────────────┘');
  console.log('\n✨ All users ready for testing!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
