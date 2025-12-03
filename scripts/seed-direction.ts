import { betterAuth } from "better-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const auth = betterAuth({
  database: prisma as any,
  emailAndPassword: {
    enabled: true,
  },
});

async function main() {
  console.log("🔐 Creating Direction user...");

  // Create Direction user via BetterAuth
  const directionUser = await auth.api.signUpEmail({
    body: {
      email: "direction@test.com",
      password: "direction123",
      name: "Direction Test",
    },
  });

  if (directionUser) {
    // Update role to DIRECTION
    await prisma.user.update({
      where: { email: "direction@test.com" },
      data: { role: "DIRECTION" },
    });

    console.log("✅ Direction user created:");
    console.log("   Email: direction@test.com");
    console.log("   Password: direction123");
    console.log("   Role: DIRECTION");
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
