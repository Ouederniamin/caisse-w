// Script to seed users through BetterAuth API
// Run with: npx ts-node scripts/seed-auth-users.ts

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const users = [
  { name: 'Admin Principal', email: 'admin@caisse.tn', password: 'password123', role: 'ADMIN' },
  { name: 'Directeur Hamdi', email: 'direction@caisse.tn', password: 'password123', role: 'DIRECTION' },
  { name: 'Directeur Adjoint', email: 'direction2@caisse.tn', password: 'password123', role: 'DIRECTION' },
  { name: 'Agent Contrôle Amine', email: 'controle1@caisse.tn', password: 'password123', role: 'AGENT_CONTROLE' },
  { name: 'Agent Contrôle Salah', email: 'controle2@caisse.tn', password: 'password123', role: 'AGENT_CONTROLE' },
  { name: 'Agent Hygiène Fatma', email: 'hygiene1@caisse.tn', password: 'password123', role: 'AGENT_HYGIENE' },
  { name: 'Agent Hygiène Nadia', email: 'hygiene2@caisse.tn', password: 'password123', role: 'AGENT_HYGIENE' },
  { name: 'Agent Sécurité Bassem', email: 'securite1@caisse.tn', password: 'password123', role: 'SECURITE' },
  { name: 'Agent Sécurité Walid', email: 'securite2@caisse.tn', password: 'password123', role: 'SECURITE' },
];

async function seedUsers() {
  console.log('🌱 Seeding users through BetterAuth API...\n');
  
  for (const user of users) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role,
        }),
      });

      const responseText = await response.text();
      
      if (response.ok) {
        console.log(`✅ Created: ${user.email} (${user.role})`);
      } else {
        console.log(`❌ Failed: ${user.email} - Status: ${response.status} - ${responseText.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${user.email} - ${error}`);
    }
  }

  console.log('\n✅ Done! Test credentials:');
  console.log('   Password for all: password123');
  users.forEach(u => console.log(`   - ${u.role}: ${u.email}`));
}

seedUsers();
