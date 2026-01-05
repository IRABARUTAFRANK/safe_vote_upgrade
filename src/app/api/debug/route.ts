import { NextResponse } from "next/server";
import { getVoterSession } from "@/lib/voterAuth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getVoterSession();
    
    if (!session) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    const normalizedMemberCode = session.memberCode.replace(/\s+/g, '').toUpperCase().trim();
    const now = new Date();

    // Find voter codes
    const voterCodes = await db.voterCode.findMany({
      where: {
        code: normalizedMemberCode,
        orgId: session.orgId,
        status: { in: ["UNUSED", "USED"] },
      },
      select: { electionId: true, code: true, status: true },
    });

    // Build accessible IDs
    const accessibleElectionIds = new Set<string>();
    if (session.electionId) {
      accessibleElectionIds.add(session.electionId);
    }
    voterCodes.forEach(vc => accessibleElectionIds.add(vc.electionId));

    // Get elections
    const elections = await db.election.findMany({
      where: {
        id: { in: Array.from(accessibleElectionIds) },
        orgId: session.orgId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        candidateMethod: true,
        applicationStartDate: true,
        applicationEndDate: true,
        startDate: true,
        endDate: true,
      },
    });

    return NextResponse.json({
      session: {
        memberId: session.memberId,
        orgId: session.orgId,
        electionId: session.electionId,
        memberCode: session.memberCode,
        isActive: session.isActive,
      },
      voterCodes,
      accessibleElectionIds: Array.from(accessibleElectionIds),
      elections,
      currentTime: now.toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
