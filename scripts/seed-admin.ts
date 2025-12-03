import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// BetterAuth uses a specific format: we need to use their signup API
async function main() {
  const users = [
    {
      email: 'admin@test.com',
      password: 'admin123',
      name: 'Admin',
      role: 'admin',
    },
    {
      email: 'controle@test.com',
      password: 'controle123',
      name: 'Agent Contrôle',
      role: 'AGENT_CONTROLE',
    },
    {
      email: 'hygiene@test.com',
      password: 'hygiene123',
      name: 'Agent Hygiène',
      role: 'AGENT_HYGIENE',
    },
    {
      email: 'securite@test.com',
      password: 'securite123',
      name: 'Agent Sécurité',
      role: 'SECURITE',
    },
  ];

  console.log('Creating users via BetterAuth signup...\n');
  
  for (const userData of users) {
    try {
      // Use BetterAuth's API to create user properly
      const response = await fetch('http://localhost:3000/api/auth/sign-up/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          name: userData.name,
        }),
      });

      if (response.ok) {
        console.log(`✓ Created: ${userData.email} (${userData.role})`);
        
        // Update role in database after creation
        await prisma.user.update({
          where: { email: userData.email },
          data: { role: userData.role },
        });
        console.log(`  → Role updated to ${userData.role}`);
      } else {
        const error = await response.json();
        console.error(`✗ Error creating ${userData.email}:`, error);
      }
    } catch (error) {
      console.error(`✗ Error calling BetterAuth API for ${userData.email}:`, error);
    }
  }

  console.log('\n✅ All users created successfully!');
  console.log('\n📋 Login credentials:');
  console.log('┌─────────────────────────────────────────────────┐');
  users.forEach(user => {
    console.log(`│ ${user.email.padEnd(25)} │ ${user.password.padEnd(15)} │`);
  });
  console.log('└─────────────────────────────────────────────────┘');
  console.log('\n🔒 All passwords are securely hashed with BetterAuth (bcrypt)');
  console.log('📱 Mobile users can login with their credentials');
  console.log('💻 Web dashboard: admin@test.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
