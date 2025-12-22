import { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    // Use bcrypt for password hashing (compatible with backend seed)
    password: {
      hash: async (password) => {
        return await bcrypt.hash(password, 10);
      },
      verify: async ({ hash, password }) => {
        return await bcrypt.compare(password, hash);
      },
    },
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
  console.log('🚀 Seeding all users for Caisse Management System...\n');

  // All users with their roles
  const users = [
    // Admin
    {
      email: 'admin@caisse.tn',
      password: 'password123',
      name: 'Administrateur',
      role: 'ADMIN',
    },
    // Direction
    {
      email: 'direction@caisse.tn',
      password: 'password123',
      name: 'Directeur Principal',
      role: 'DIRECTION',
    },
    {
      email: 'direction2@caisse.tn',
      password: 'password123',
      name: 'Directeur Adjoint',
      role: 'DIRECTION',
    },
    // Agent Contrôle
    {
      email: 'controle1@caisse.tn',
      password: 'password123',
      name: 'Agent Contrôle 1',
      role: 'AGENT_CONTROLE',
    },
    {
      email: 'controle2@caisse.tn',
      password: 'password123',
      name: 'Agent Contrôle 2',
      role: 'AGENT_CONTROLE',
    },
    // Agent Hygiène
    {
      email: 'hygiene1@caisse.tn',
      password: 'password123',
      name: 'Agent Hygiène 1',
      role: 'AGENT_HYGIENE',
    },
    {
      email: 'hygiene2@caisse.tn',
      password: 'password123',
      name: 'Agent Hygiène 2',
      role: 'AGENT_HYGIENE',
    },
    // Sécurité
    {
      email: 'securite1@caisse.tn',
      password: 'password123',
      name: 'Agent Sécurité 1',
      role: 'SECURITE',
    },
    {
      email: 'securite2@caisse.tn',
      password: 'password123',
      name: 'Agent Sécurité 2',
      role: 'SECURITE',
    },
  ];

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const userData of users) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`⏭️  User ${userData.email} already exists, skipping...`);
        skipped++;
        continue;
      }

      // Create user via BetterAuth API - this properly hashes the password
      console.log(`📝 Creating user: ${userData.email}...`);
      const result = await auth.api.signUpEmail({
        body: {
          email: userData.email,
          password: userData.password,
          name: userData.name,
        },
      });

      if (result) {
        // Update role after creation
        await prisma.user.update({
          where: { email: userData.email },
          data: { role: userData.role },
        });

        console.log(`✅ Created: ${userData.email} (${userData.role})`);
        created++;
      }
    } catch (error) {
      console.error(`❌ Error creating ${userData.email}:`, error);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Created: ${created}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);

  console.log('\n' + '='.repeat(60));
  console.log('📋 ALL USER CREDENTIALS');
  console.log('='.repeat(60));
  console.log('');
  console.log('┌────────────────────────────┬────────────────┬───────────────────┐');
  console.log('│ Email                      │ Password       │ Role              │');
  console.log('├────────────────────────────┼────────────────┼───────────────────┤');
  users.forEach(user => {
    console.log(`│ ${user.email.padEnd(26)} │ ${user.password.padEnd(14)} │ ${user.role.padEnd(17)} │`);
  });
  console.log('└────────────────────────────┴────────────────┴───────────────────┘');

  console.log('\n' + '='.repeat(60));
  console.log('🎯 QUICK ACCESS');
  console.log('='.repeat(60));
  console.log('');
  console.log('🌐 Web Dashboard: http://localhost:3000');
  console.log('   → Admin: admin@caisse.tn / password123');
  console.log('   → Direction: direction@caisse.tn / password123');
  console.log('');
  console.log('📱 Mobile App:');
  console.log('   → Contrôle: controle1@caisse.tn / password123');
  console.log('   → Hygiène: hygiene1@caisse.tn / password123');
  console.log('   → Sécurité: securite1@caisse.tn / password123');
  console.log('');
  console.log('✨ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
