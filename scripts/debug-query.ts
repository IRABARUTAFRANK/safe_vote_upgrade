import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const db = new PrismaClient({ adapter } as any);

async function simulate() {
  // Simulate the session
  const session = {
    memberId: "cmk136hcy000u94pyekcjw321",
    orgId: "cmk12tdif000194pymakj6hvp",
    electionId: "cmk12xegc000494pyebil845r",
    memberCode: "2FHWJ",
  };
  
  const now = new Date();
  console.log("Current time:", now.toISOString());
  console.log("Session:", session);

  // Step 1: Build accessible election IDs
  const accessibleElectionIds = new Set<string>();
  
  if (session.electionId) {
    accessibleElectionIds.add(session.electionId);
    console.log("\nAdded election from session:", session.electionId);
  }

  const normalizedMemberCode = session.memberCode.replace(/\s+/g, '').toUpperCase().trim();
  console.log("Normalized code:", normalizedMemberCode);

  const memberVoterCodes = await db.voterCode.findMany({
    where: {
      code: normalizedMemberCode,
      orgId: session.orgId,
      status: { in: ["UNUSED", "USED"] },
    },
    select: { electionId: true },
  });
  
  console.log("VoterCodes found:", memberVoterCodes);
  memberVoterCodes.forEach((vc: { electionId: string }) => accessibleElectionIds.add(vc.electionId));

  console.log("Accessible election IDs:", Array.from(accessibleElectionIds));

  // Step 2: Query for application elections
  console.log("\n=== Querying for APPLICATION elections ===");
  const elections = await db.election.findMany({
    where: {
      id: { in: Array.from(accessibleElectionIds) },
      orgId: session.orgId,
      candidateMethod: "APPLICATION",
      status: { in: ["DRAFT", "ACTIVE"] },
      OR: [
        {
          applicationStartDate: { lte: now },
          applicationEndDate: { gte: now },
        },
        {
          applicationStartDate: null,
          applicationEndDate: { gte: now },
        },
        {
          applicationStartDate: { lte: now },
          applicationEndDate: null,
        },
      ],
    },
    include: {
      positions: {
        orderBy: { displayOrder: "asc" },
      },
      applicationForm: {
        orderBy: { displayOrder: "asc" },
      },
      applications: {
        where: { applicantId: session.memberId },
        select: { id: true, positionId: true, status: true },
      },
    },
  });

  console.log("Elections found:", elections.length);
  elections.forEach((e: any) => {
    console.log(`  - ${e.title} (${e.status})`);
    console.log(`    Positions: ${e.positions.length}`);
    console.log(`    Form fields: ${e.applicationForm.length}`);
  });

  // Step 3: Query for ACTIVE voting elections
  console.log("\n=== Querying for ACTIVE voting elections ===");
  const votingElections = await db.election.findMany({
    where: {
      id: { in: Array.from(accessibleElectionIds) },
      orgId: session.orgId,
      status: "ACTIVE",
      startDate: { lte: now },
      endDate: { gte: now },
    },
  });

  console.log("Voting elections found:", votingElections.length);
  votingElections.forEach((e: any) => {
    console.log(`  - ${e.title} (${e.status})`);
  });

  // Check raw election data
  console.log("\n=== Raw election data ===");
  const rawElection = await db.election.findUnique({
    where: { id: session.electionId },
  });
  console.log("Election:", rawElection);
}

simulate()
  .catch(console.error)
  .finally(() => db.$disconnect());
