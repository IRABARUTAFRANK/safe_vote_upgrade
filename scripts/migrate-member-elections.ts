import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🔄 Migrating existing members to link with their elections...");

  // Get all members that don't have an electionId set
  const membersWithoutElection = await prisma.member.findMany({
    where: {
      electionId: null,
    },
    select: {
      id: true,
      memberCode: true,
      orgId: true,
    },
  });

  console.log(`Found ${membersWithoutElection.length} members without election link`);

  let updated = 0;
  let skipped = 0;

  for (const member of membersWithoutElection) {
    // Find the voter code that matches this member's code
    const voterCode = await prisma.voterCode.findFirst({
      where: {
        code: member.memberCode.replace(/\s+/g, '').toUpperCase().trim(),
        orgId: member.orgId,
      },
      select: {
        electionId: true,
      },
    });

    if (voterCode) {
      // Update the member with the election ID
      await prisma.member.update({
        where: { id: member.id },
        data: { electionId: voterCode.electionId },
      });
      updated++;
      console.log(`✅ Updated member ${member.id} -> election ${voterCode.electionId}`);
    } else {
      skipped++;
      console.log(`⚠️ No matching voter code found for member ${member.id} (code: ${member.memberCode})`);
    }
  }

  console.log(`\n🎉 Migration completed!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
