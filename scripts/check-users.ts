import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('📋 Checking all users in database...\n');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (users.length === 0) {
    console.log('❌ No users found in database!\n');
    return;
  }

  console.log(`✅ Found ${users.length} user(s):\n`);
  console.log('┌─────────────────────────────────────────────────────────────────────────────────┐');
  console.log('│ Email                      Name                Role            Verified        │');
  console.log('├─────────────────────────────────────────────────────────────────────────────────┤');
  
  users.forEach(user => {
    const email = (user.email || '').padEnd(26);
    const name = (user.name || 'N/A').padEnd(20);
    const role = (user.role || 'N/A').padEnd(16);
    const verified = user.emailVerified ? '✓' : '✗';
    console.log(`│ ${email} ${name} ${role} ${verified.padEnd(15)} │`);
  });
  
  console.log('└─────────────────────────────────────────────────────────────────────────────────┘\n');

  // Count by role
  const roleCounts = users.reduce((acc: any, user) => {
    const role = user.role || 'unknown';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  console.log('📊 Users by role:');
  Object.entries(roleCounts).forEach(([role, count]) => {
    console.log(`   ${role}: ${count}`);
  });

  console.log('\n🔑 Test credentials (if not set, run: npm run seed):');
  console.log('   admin@test.com / admin123');
  console.log('   direction@test.com / direction123');
}

checkUsers()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
