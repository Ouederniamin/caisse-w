import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Cleaning up ALL users...');
  
  // Delete all sessions
  await prisma.session.deleteMany({});
  console.log('✓ Deleted all sessions');
  
  // Delete all accounts
  await prisma.account.deleteMany({});
  console.log('✓ Deleted all accounts');
  
  // Delete all users
  await prisma.user.deleteMany({});
  console.log('✓ Deleted all users');

  console.log('\n✅ Database cleaned successfully!');
  console.log('\nNow run: npx tsx scripts/seed-admin.ts');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
