import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌱 Seeding database...");

  // Hash the password: frank123!
  const passwordHash = await bcrypt.hash("frank123!", 12);

  // Create or update super admin
  const superAdmin = await prisma.superAdmin.upsert({
    where: { email: "frank@gmail.com" },
    update: {
      passwordHash,
      fullName: "Frank",
      isActive: true,
    },
    create: {
      email: "frank@gmail.com",
      passwordHash,
      fullName: "Frank",
      isActive: true,
    },
  });

  console.log("✅ Super Admin created:", {
    id: superAdmin.id,
    email: superAdmin.email,
    fullName: superAdmin.fullName,
  });

  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
