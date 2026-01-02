"use server";

import { db } from "@/lib/db";
import { getOrgAdminSession } from "@/lib/orgAuth";
import { generateMemberCode, extractOrgIdentity } from "@/lib/orgCode";
import { validateAndSanitizeInput, getClientIp, logSecurityEvent } from "@/lib/security";
import { revalidatePath } from "next/cache";

/**
 * Create a new election
 */
export async function createElection(formData: FormData) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const title = (formData.get("title") as string) || "";
  const startDate = (formData.get("startDate") as string) || "";
  const endDate = (formData.get("endDate") as string) || "";
  const numberOfVoters = (formData.get("numberOfVoters") as string) || "";

  // Validate inputs
  const titleValidation = validateAndSanitizeInput(title, {
    type: "text",
    maxLength: 200,
    required: true,
  });
  if (!titleValidation.valid) {
    return { success: false, error: titleValidation.error || "Invalid title" };
  }

  if (!startDate || !endDate) {
    return { success: false, error: "Start date and end date are required" };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { success: false, error: "Invalid date format" };
  }

  if (start >= end) {
    return { success: false, error: "End date must be after start date" };
  }

  if (start < now) {
    return { success: false, error: "Start date must be in the future" };
  }

  const voterCount = parseInt(numberOfVoters, 10);
  if (isNaN(voterCount) || voterCount < 1 || voterCount > 100000) {
    return { success: false, error: "Number of voters must be between 1 and 100,000" };
  }

  try {
    // Get organization to extract org identity
    const organisation = await db.organisation.findUnique({
      where: { id: session.orgId },
      select: { orgCode: true },
    });

    if (!organisation || !organisation.orgCode) {
      return { success: false, error: "Organization code not found" };
    }

    const orgIdentity = extractOrgIdentity(organisation.orgCode);

    // Create election and generate voter codes in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create election
      const election = await tx.election.create({
        data: {
          orgId: session.orgId,
          title: titleValidation.sanitized!,
          startDate: start,
          endDate: end,
          status: "DRAFT",
        },
      });

      // Generate member codes for voters
      const members = [];
      const usedCodes = new Set<string>();

      for (let i = 0; i < voterCount; i++) {
        let memberCode = generateMemberCode(orgIdentity);
        let retries = 0;
        
        // Ensure uniqueness
        while (usedCodes.has(memberCode) && retries < 10) {
          memberCode = generateMemberCode(orgIdentity);
          retries++;
        }

        // Double-check against database
        const existing = await tx.member.findUnique({ where: { memberCode } });
        if (existing) {
          // If collision, try one more time
          memberCode = generateMemberCode(orgIdentity);
        }

        usedCodes.add(memberCode);

        members.push({
          orgId: session.orgId,
          fullName: `Voter ${i + 1}`, // Placeholder name, can be updated later
          memberCode,
          role: "VOTER",
        });
      }

      // Batch create members (Prisma supports createMany)
      await tx.member.createMany({
        data: members,
        skipDuplicates: true,
      });

      return election;
    });

    revalidatePath("/organisation/dashboard");
    revalidatePath("/organisation/dashboard/elections");

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Create election error:", error);
    return { success: false, error: "Failed to create election" };
  }
}

/**
 * Get all elections for the organization
 */
export async function getElections() {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const elections = await db.election.findMany({
      where: { orgId: session.orgId },
      include: {
        _count: {
          select: {
            positions: true,
            ballots: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    return { success: true, data: elections };
  } catch (error) {
    console.error("Get elections error:", error);
    return { success: false, error: "Failed to fetch elections" };
  }
}

/**
 * Get election details
 */
export async function getElectionDetails(electionId: string) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const election = await db.election.findFirst({
      where: {
        id: electionId,
        orgId: session.orgId,
      },
      include: {
        positions: {
          include: {
            candidates: {
              include: {
                _count: {
                  select: { votes: true },
                },
              },
            },
            _count: {
              select: { votes: true },
            },
          },
        },
        _count: {
          select: {
            ballots: true,
          },
        },
      },
    });

    if (!election) {
      return { success: false, error: "Election not found" };
    }

    return { success: true, data: election };
  } catch (error) {
    console.error("Get election details error:", error);
    return { success: false, error: "Failed to fetch election details" };
  }
}

/**
 * Update election status
 */
export async function updateElectionStatus(electionId: string, status: string) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const validStatuses = ["DRAFT", "ACTIVE", "CLOSED", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    return { success: false, error: "Invalid status" };
  }

  try {
    const election = await db.election.updateMany({
      where: {
        id: electionId,
        orgId: session.orgId,
      },
      data: { status },
    });

    if (election.count === 0) {
      return { success: false, error: "Election not found" };
    }

    revalidatePath("/organisation/dashboard");
    revalidatePath(`/organisation/dashboard/elections/${electionId}`);

    return { success: true };
  } catch (error) {
    console.error("Update election status error:", error);
    return { success: false, error: "Failed to update election status" };
  }
}

/**
 * Add position to election
 */
export async function addPosition(electionId: string, positionName: string) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const nameValidation = validateAndSanitizeInput(positionName, {
    type: "text",
    maxLength: 100,
    required: true,
  });
  if (!nameValidation.valid) {
    return { success: false, error: nameValidation.error || "Invalid position name" };
  }

  try {
    // Verify election belongs to organization
    const election = await db.election.findFirst({
      where: {
        id: electionId,
        orgId: session.orgId,
      },
    });

    if (!election) {
      return { success: false, error: "Election not found" };
    }

    const position = await db.position.create({
      data: {
        electionId,
        name: nameValidation.sanitized!,
      },
    });

    revalidatePath(`/organisation/dashboard/elections/${electionId}`);

    return { success: true, data: position };
  } catch (error) {
    console.error("Add position error:", error);
    return { success: false, error: "Failed to add position" };
  }
}

/**
 * Delete position
 */
export async function deletePosition(positionId: string) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Verify position belongs to organization's election
    const position = await db.position.findFirst({
      where: { id: positionId },
      include: {
        election: true,
      },
    });

    if (!position || position.election.orgId !== session.orgId) {
      return { success: false, error: "Position not found" };
    }

    await db.position.delete({
      where: { id: positionId },
    });

    revalidatePath(`/organisation/dashboard/elections/${position.electionId}`);

    return { success: true };
  } catch (error) {
    console.error("Delete position error:", error);
    return { success: false, error: "Failed to delete position" };
  }
}

/**
 * Add candidate to position
 */
export async function addCandidate(positionId: string, candidateName: string) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const nameValidation = validateAndSanitizeInput(candidateName, {
    type: "text",
    maxLength: 100,
    required: true,
  });
  if (!nameValidation.valid) {
    return { success: false, error: nameValidation.error || "Invalid candidate name" };
  }

  try {
    // Verify position belongs to organization's election
    const position = await db.position.findFirst({
      where: { id: positionId },
      include: {
        election: true,
      },
    });

    if (!position || position.election.orgId !== session.orgId) {
      return { success: false, error: "Position not found" };
    }

    const candidate = await db.candidate.create({
      data: {
        positionId,
        name: nameValidation.sanitized!,
      },
    });

    revalidatePath(`/organisation/dashboard/elections/${position.electionId}`);

    return { success: true, data: candidate };
  } catch (error) {
    console.error("Add candidate error:", error);
    return { success: false, error: "Failed to add candidate" };
  }
}

/**
 * Delete candidate
 */
export async function deleteCandidate(candidateId: string) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Verify candidate belongs to organization's election
    const candidate = await db.candidate.findFirst({
      where: { id: candidateId },
      include: {
        position: {
          include: {
            election: true,
          },
        },
      },
    });

    if (!candidate || candidate.position.election.orgId !== session.orgId) {
      return { success: false, error: "Candidate not found" };
    }

    await db.candidate.delete({
      where: { id: candidateId },
    });

    revalidatePath(`/organisation/dashboard/elections/${candidate.position.electionId}`);

    return { success: true };
  } catch (error) {
    console.error("Delete candidate error:", error);
    return { success: false, error: "Failed to delete candidate" };
  }
}

/**
 * Get real-time election statistics
 */
export async function getElectionStats(electionId: string) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const election = await db.election.findFirst({
      where: {
        id: electionId,
        orgId: session.orgId,
      },
      include: {
        positions: {
          include: {
            candidates: {
              include: {
                _count: {
                  select: { votes: true },
                },
              },
            },
            _count: {
              select: { votes: true },
            },
          },
        },
        _count: {
          select: {
            ballots: true,
          },
        },
      },
    });

    if (!election) {
      return { success: false, error: "Election not found" };
    }

    // Get total number of eligible voters (members with role VOTER)
    const totalVoters = await db.member.count({
      where: {
        orgId: session.orgId,
        role: "VOTER",
      },
    });

    return {
      success: true,
      data: {
        election,
        totalVoters,
        votesCast: election._count.ballots,
        participationRate: totalVoters > 0 ? (election._count.ballots / totalVoters) * 100 : 0,
      },
    };
  } catch (error) {
    console.error("Get election stats error:", error);
    return { success: false, error: "Failed to fetch election statistics" };
  }
}

