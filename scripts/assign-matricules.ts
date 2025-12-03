import prisma from "../src/lib/prisma";

// Generate random 3-digit number in range 190-240
function generateFirstThreeDigits(): string {
  const num = Math.floor(Math.random() * (240 - 190 + 1)) + 190;
  return num.toString().padStart(3, '0');
}

// Generate random 4-digit number
function generateLastFourDigits(): string {
  const num = Math.floor(Math.random() * 10000);
  return num.toString().padStart(4, '0');
}

// Check if matricule already exists
async function matriculeExists(matricule: string): Promise<boolean> {
  const existing = await prisma.driver.findFirst({
    where: {
      matricule_par_defaut: matricule,
    },
  });
  return !!existing;
}

// Generate unique matricule
async function generateUniqueMatricule(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const first = generateFirstThreeDigits();
    const last = generateLastFourDigits();
    const matricule = `${first} تونس ${last}`;

    if (!(await matriculeExists(matricule))) {
      return matricule;
    }

    attempts++;
  }

  throw new Error("Failed to generate unique matricule after 100 attempts");
}

async function assignMatricules() {
  console.log("🔍 Fetching drivers without matricules...");

  const driversWithoutMatricule = await prisma.driver.findMany({
    where: {
      matricule_par_defaut: null,
    },
    select: {
      id: true,
      nom_complet: true,
      matricule_par_defaut: true,
    },
  });

  if (driversWithoutMatricule.length === 0) {
    console.log("✅ All drivers already have matricules!");
    await prisma.$disconnect();
    return;
  }

  console.log(`✅ Found ${driversWithoutMatricule.length} driver(s) without matricule\n`);

  let assigned = 0;

  for (const driver of driversWithoutMatricule) {
    try {
      const newMatricule = await generateUniqueMatricule();

      await prisma.driver.update({
        where: { id: driver.id },
        data: { matricule_par_defaut: newMatricule },
      });

      console.log(`✅ ${driver.nom_complet}: Assigned "${newMatricule}"`);
      assigned++;
    } catch (error) {
      console.error(`❌ ${driver.nom_complet}: Failed to assign matricule`, error);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Assigned: ${assigned}`);
  console.log(`   ❌ Failed: ${driversWithoutMatricule.length - assigned}`);

  await prisma.$disconnect();
}

assignMatricules()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
