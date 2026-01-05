import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const db = new PrismaClient({ adapter } as any);

async function check() {
  // Find member with the used code
  const member = await db.member.findFirst({
    where: { memberCode: '2FHWJ' },
    include: { organisation: true, election: true }
  });
  console.log('Member with 2FHWJ:', JSON.stringify(member, null, 2));

  // Check the voterCode
  const voterCode = await db.voterCode.findFirst({
    where: { code: '2FHWJ' }
  });
  console.log('\nVoterCode 2FHWJ:', JSON.stringify(voterCode, null, 2));

  // Get the election details
  const election = await db.election.findFirst({
    where: { id: 'cmk12xegc000494pyebil845r' },
    select: {
      id: true,
      title: true,
      status: true,
      candidateMethod: true,
      applicationStartDate: true,
      applicationEndDate: true,
      startDate: true,
      endDate: true,
    }
  });
  console.log('\nElection:', JSON.stringify(election, null, 2));
  
  const now = new Date();
  console.log('\nCurrent time:', now.toISOString());
  if (election) {
    console.log('Election Status:', election.status);
    console.log('App Start:', election.applicationStartDate);
    console.log('App End:', election.applicationEndDate);
    console.log('App Start <= Now:', new Date(election.applicationStartDate!) <= now);
    console.log('App End >= Now:', new Date(election.applicationEndDate!) >= now);
    console.log('Vote Start <= Now:', new Date(election.startDate) <= now);
    console.log('Vote End >= Now:', new Date(election.endDate) >= now);
  }
}

check()
  .catch(console.error)
  .finally(() => db.$disconnect());
