import prisma from "../src/lib/prisma";

async function normalizeMatricules() {
  console.log("🔍 Fetching all drivers...");
  
  const drivers = await prisma.driver.findMany({
    select: {
      id: true,
      nom_complet: true,
      matricule_par_defaut: true,
    },
  });

  console.log(`✅ Found ${drivers.length} driver(s)\n`);

  let updated = 0;
  let deleted = 0;
  let skipped = 0;

  for (const driver of drivers) {
    if (!driver.matricule_par_defaut) {
      skipped++;
      continue;
    }

    // Extract all digits from matricule
    const digits = driver.matricule_par_defaut.replace(/[^0-9]/g, "");
    
    if (digits.length < 7) {
      console.log(`⚠️  ${driver.nom_complet}: Invalid matricule (not enough digits) - "${driver.matricule_par_defaut}"`);
      // Set to null if invalid
      await prisma.driver.update({
        where: { id: driver.id },
        data: { matricule_par_defaut: null },
      });
      deleted++;
      continue;
    }

    // Get first 3 digits
    const firstThree = parseInt(digits.slice(0, 3));
    const lastFour = digits.slice(-4);

    // Check if first 3 digits are in valid range (190-240)
    if (firstThree < 190 || firstThree > 240) {
      console.log(`❌ ${driver.nom_complet}: Out of range (${firstThree}) - DELETING matricule "${driver.matricule_par_defaut}"`);
      await prisma.driver.update({
        where: { id: driver.id },
        data: { matricule_par_defaut: null },
      });
      deleted++;
      continue;
    }

    // Normalize format: NNN تونس NNNN (store with Arabic word)
    const normalizedMatricule = `${firstThree.toString().padStart(3, '0')} تونس ${lastFour}`;
    
    if (driver.matricule_par_defaut !== normalizedMatricule) {
      console.log(`🔄 ${driver.nom_complet}: "${driver.matricule_par_defaut}" → "${normalizedMatricule}"`);
      await prisma.driver.update({
        where: { id: driver.id },
        data: { matricule_par_defaut: normalizedMatricule },
      });
      updated++;
    } else {
      skipped++;
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ❌ Deleted (out of range): ${deleted}`);
  console.log(`   ⏭️  Skipped (already correct or null): ${skipped}`);
  
  await prisma.$disconnect();
}

normalizeMatricules()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
