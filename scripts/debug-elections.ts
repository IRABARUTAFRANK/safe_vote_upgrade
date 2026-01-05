import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const db = new PrismaClient({ adapter } as any);

async function debug() {
  console.log("=== DEBUG: Elections and Members ===\n");

  // Get recent elections
  const elections = await db.election.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      title: true,
      status: true,
      candidateMethod: true,
      applicationStartDate: true,
      applicationEndDate: true,
      startDate: true,
      endDate: true,
      orgId: true,
      _count: { select: { voterCodes: true, members: true } }
    }
  });
  console.log('Recent Elections:');
  elections.forEach(e => {
    console.log(`  - ${e.title}`);
    console.log(`    ID: ${e.id}`);
    console.log(`    Status: ${e.status}`);
    console.log(`    Method: ${e.candidateMethod}`);
    console.log(`    App Dates: ${e.applicationStartDate} to ${e.applicationEndDate}`);
    console.log(`    Vote Dates: ${e.startDate} to ${e.endDate}`);
    console.log(`    VoterCodes: ${e._count.voterCodes}, Members: ${e._count.members}`);
    console.log('');
  });

  // Get recent members with VOTER role
  const members = await db.member.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    where: { role: 'VOTER' },
    select: {
      id: true,
      memberCode: true,
      electionId: true,
      isActive: true,
      orgId: true,
      fullName: true
    }
  });
  console.log('\nRecent VOTER Members:');
  members.forEach(m => {
    console.log(`  - ${m.fullName} (${m.memberCode})`);
    console.log(`    ElectionId: ${m.electionId || 'NULL'}`);
    console.log(`    IsActive: ${m.isActive}`);
    console.log(`    OrgId: ${m.orgId}`);
    console.log('');
  });

  // Check if member codes match voter codes
  if (members.length > 0 && elections.length > 0) {
    console.log('\n=== Checking VoterCode matches ===');
    for (const m of members.slice(0, 3)) {
      const normalizedCode = m.memberCode.replace(/\s+/g, '').toUpperCase().trim();
      const voterCode = await db.voterCode.findFirst({
        where: {
          code: normalizedCode,
          orgId: m.orgId,
        },
        select: { code: true, electionId: true, status: true }
      });
      console.log(`Member ${m.memberCode}:`);
      console.log(`  VoterCode found: ${voterCode ? 'YES' : 'NO'}`);
      if (voterCode) {
        console.log(`  VoterCode electionId: ${voterCode.electionId}`);
        console.log(`  VoterCode status: ${voterCode.status}`);
      }
      console.log('');
    }
  }

  // Check latest election's voter codes
  if (elections.length > 0) {
    const latestElection = elections[0];
    const voterCodes = await db.voterCode.findMany({
      where: { electionId: latestElection.id },
      take: 5,
      select: { code: true, status: true }
    });
    console.log(`\nVoterCodes for "${latestElection.title}":`);
    voterCodes.forEach(vc => {
      console.log(`  - ${vc.code} (${vc.status})`);
    });
  }
}

debug()
  .catch(console.error)
  .finally(() => db.$disconnect());
