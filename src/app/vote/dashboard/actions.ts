"use server";

import { db } from "@/lib/db";
import { requireVoter, logoutVoter, getVoterSession, getVoterAccountStatus } from "@/lib/voterAuth";
import { getClientIp, logSecurityEvent } from "@/lib/security";
import { updateElectionStatuses } from "@/lib/electionStatusHelper";
import { revalidatePath } from "next/cache";

// Get voter account status
export async function getAccountStatus() {
  try {
    const status = await getVoterAccountStatus();
    return { success: true, data: status };
  } catch (error) {
    console.error("Get account status error:", error);
    return { success: false, error: "Failed to get account status" };
  }
}

// Get active elections for voter
export async function getActiveElections() {
  const session = await requireVoter();

  try {
    // First, update any election statuses that may have changed
    await updateElectionStatuses();
    
    const now = new Date();
    
    // Normalize the member code for comparison
    const normalizedMemberCode = session.memberCode.replace(/\s+/g, '').toUpperCase().trim();
    
    // Find all elections the member has access to
    const accessibleElectionIds = new Set<string>();
    
    // Add election from session if exists
    if (session.electionId) {
      accessibleElectionIds.add(session.electionId);
    }
    
    // Also check for voter codes with matching member code
    const voterCodes = await db.voterCode.findMany({
      where: {
        code: normalizedMemberCode,
        orgId: session.orgId,
        status: { in: ["UNUSED", "USED"] },
      },
      select: { electionId: true },
    });
    
    voterCodes.forEach(vc => accessibleElectionIds.add(vc.electionId));
    
    // If not found yet and no session electionId, try finding election via the voter code
    if (accessibleElectionIds.size === 0 && !session.electionId) {
      const codeRecord = await db.voterCode.findFirst({
        where: {
          code: normalizedMemberCode,
          orgId: session.orgId,
          status: { in: ["UNUSED", "USED"] },
        },
        select: { electionId: true },
      });
      
      if (codeRecord) {
        accessibleElectionIds.add(codeRecord.electionId);
        // Update member record to link to election for future queries
        await db.member.update({
          where: { id: session.memberId },
          data: { electionId: codeRecord.electionId },
        }).catch(err => console.log("Could not update member electionId:", err));
      }
    }
    
    if (accessibleElectionIds.size === 0) {
      return { success: true, data: [] };
    }

    const elections = await db.election.findMany({
      where: {
        id: { in: Array.from(accessibleElectionIds) },
        orgId: session.orgId,
        status: "ACTIVE",
        startDate: { lte: now },
        endDate: { gte: now },
        // Ensure election is properly linked to voter through voter code
      },
      include: {
        positions: {
          include: {
            candidates: {
              where: { isApproved: true }, // Only show approved candidates
              orderBy: { displayOrder: "asc" },
            },
          },
          orderBy: { displayOrder: "asc" },
        },
        _count: {
          select: {
            ballots: true,
            voterCodes: true,
          },
        },
      },
    });

    // Check voting status for each election
    const electionsWithVotingStatus = await Promise.all(
      elections.map(async (election) => {
        // Check if voter has already voted
        const existingBallot = await db.ballot.findFirst({
          where: {
            electionId: election.id,
            voterId: session.memberId,
          },
        });

        // Get the voter code for this election
        const voterCode = await db.voterCode.findFirst({
          where: {
            electionId: election.id,
            code: normalizedMemberCode,
            status: { in: ["UNUSED", "USED"] },
          },
        });

        // Can vote if not already voted
        const canVote = !existingBallot;

        return {
          ...election,
          canVote,
          hasVoted: !!existingBallot,
          voterCodeId: voterCode?.id,
        };
      })
    );

    return { success: true, data: electionsWithVotingStatus };
  } catch (error) {
    console.error("Get active elections error:", error);
    return { success: false, error: "Failed to fetch elections" };
  }
}

// Get election details for voting
export async function getElectionForVoting(electionId: string) {
  const session = await requireVoter();

  try {
    const normalizedMemberCode = session.memberCode.replace(/\s+/g, '').toUpperCase().trim();
    
    // Check if member has access to this election
    const hasDirectAccess = session.electionId === electionId;
    
    let voterCode = null;
    if (!hasDirectAccess) {
      // Check for voter code
      voterCode = await db.voterCode.findFirst({
        where: {
          electionId: electionId,
          code: normalizedMemberCode,
          orgId: session.orgId,
          status: { in: ["UNUSED", "USED"] },
        },
      });

      if (!voterCode) {
        return { success: false, error: "You do not have permission to vote in this election" };
      }
    } else {
      // Get voter code if linked via session
      voterCode = await db.voterCode.findFirst({
        where: {
          electionId: electionId,
          code: normalizedMemberCode,
          status: { in: ["UNUSED", "USED"] },
        },
      });
    }

    const election = await db.election.findFirst({
      where: {
        id: electionId,
        orgId: session.orgId,
        status: "ACTIVE",
      },
      include: {
        positions: {
          include: {
            candidates: {
              where: { isApproved: true }, // Only show approved candidates
              orderBy: { displayOrder: "asc" },
            },
          },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!election) {
      return { success: false, error: "Election not found or not active" };
    }

    // Check if voter has already voted
    const existingBallot = await db.ballot.findFirst({
      where: {
        electionId: election.id,
        voterId: session.memberId,
      },
    });

    if (existingBallot) {
      return { success: false, error: "You have already voted in this election" };
    }

    return { 
      success: true, 
      data: {
        ...election,
        voterCodeId: voterCode?.id || null,
      },
    };
  } catch (error) {
    console.error("Get election for voting error:", error);
    return { success: false, error: "Failed to fetch election" };
  }
}

// Cast vote
export async function castVote(
  electionId: string,
  votes: Array<{ positionId: string; candidateIds: string[] }>
) {
  const session = await requireVoter();
  const ipAddress = await getClientIp();

  try {
    // Verify election is active and voter can vote
    const electionResult = await getElectionForVoting(electionId);
    if (!electionResult.success || !electionResult.data) {
      return { success: false, error: electionResult.error || "Cannot vote in this election" };
    }

    const election = electionResult.data;

    // Validate votes
    if (!votes || votes.length === 0) {
      return { success: false, error: "No votes submitted" };
    }

    // Validate each position vote
    for (const vote of votes) {
      const position = election.positions.find(p => p.id === vote.positionId);
      if (!position) {
        return { success: false, error: `Invalid position: ${vote.positionId}` };
      }

      if (vote.candidateIds.length < position.minVotes) {
        return { success: false, error: `Position "${position.name}" requires at least ${position.minVotes} vote(s)` };
      }

      if (vote.candidateIds.length > position.maxVotes) {
        return { success: false, error: `Position "${position.name}" allows maximum ${position.maxVotes} vote(s)` };
      }

      // Verify all candidates belong to the position
      const validCandidateIds = position.candidates.map(c => c.id);
      for (const candidateId of vote.candidateIds) {
        if (!validCandidateIds.includes(candidateId)) {
          return { success: false, error: `Invalid candidate for position "${position.name}"` };
        }
      }
    }

    // Normalize member code for voter code lookup
    const normalizedMemberCode = session.memberCode.replace(/\s+/g, '').toUpperCase().trim();

    // Create ballot and votes in a transaction
    const result = await db.$transaction(async (tx) => {
      // Double-check no ballot exists (race condition protection)
      const existingBallot = await tx.ballot.findFirst({
        where: {
          electionId: election.id,
          voterId: session.memberId,
        },
      });

      if (existingBallot) {
        throw new Error("You have already voted in this election");
      }

      // Get the voter code for this election
      let voterCodeId = election.voterCodeId || null;
      
      // If election requires voter codes, find the voter code
      const voterCodeCount = await db.voterCode.count({
        where: { electionId: election.id },
      });
      
      if (voterCodeCount > 0 && !voterCodeId) {
        const voterCode = await tx.voterCode.findFirst({
          where: {
            electionId: election.id,
            code: normalizedMemberCode,
            status: { in: ["UNUSED", "USED"] },
          },
        });
        voterCodeId = voterCode?.id || null;
      }

      // Create ballot
      const ballot = await tx.ballot.create({
        data: {
          voterId: session.memberId,
          electionId: election.id,
          voterCodeId,
          ipAddress,
        },
      });

      // Create votes linked to the ballot
      const voteRecords = [];
      for (const vote of votes) {
        for (const candidateId of vote.candidateIds) {
          voteRecords.push({
            ballotId: ballot.id,
            positionId: vote.positionId,
            candidateId,
          });
        }
      }

      await tx.vote.createMany({
        data: voteRecords,
      });

      // Update voter code status if it exists
      if (election.voterCodeId) {
        await tx.voterCode.update({
          where: { id: election.voterCodeId },
          data: {
            status: "USED",
            usedAt: new Date(),
            usedByIp: ipAddress,
          },
        });
      }

      return ballot;
    });

    await logSecurityEvent("VOTE_CAST", `Vote cast in election: ${election.title}`, ipAddress, session.memberId);

    revalidatePath("/vote/dashboard");
    revalidatePath(`/vote/dashboard/elections/${electionId}`);

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Cast vote error:", error);
    if (error?.code === 'P2002') {
      return { success: false, error: "You have already voted in this election" };
    }
    if (error?.message) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to cast vote. Please try again." };
  }
}

// Get voting history
export async function getVotingHistory() {
  const session = await requireVoter();

  try {
    const ballots = await db.ballot.findMany({
      where: {
        voterId: session.memberId,
      },
      include: {
        election: {
          include: {
            _count: {
              select: {
                ballots: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: ballots };
  } catch (error) {
    console.error("Get voting history error:", error);
    return { success: false, error: "Failed to fetch voting history" };
  }
}

// Get election results (if election is closed)
export async function getElectionResults(electionId: string) {
  const session = await requireVoter();

  try {
    const election = await db.election.findFirst({
      where: {
        id: electionId,
        orgId: session.orgId,
        status: { in: ["CLOSED", "ACTIVE"] }, // Allow viewing results even if active
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
              orderBy: { displayOrder: "asc" },
            },
            _count: {
              select: { votes: true },
            },
          },
          orderBy: { displayOrder: "asc" },
        },
        _count: {
          select: {
            ballots: true,
            voterCodes: true,
          },
        },
      },
    });

    if (!election) {
      return { success: false, error: "Election not found" };
    }

    // Calculate results
    const positionResults = election.positions.map(position => ({
      id: position.id,
      name: position.name,
      maxWinners: position.maxWinners,
      totalVotes: position._count.votes,
      candidates: position.candidates
        .map(candidate => ({
          id: candidate.id,
          name: candidate.name,
          photoUrl: candidate.photoUrl,
          votes: candidate._count.votes,
          percentage: position._count.votes > 0 
            ? (candidate._count.votes / position._count.votes) * 100 
            : 0,
        }))
        .sort((a, b) => b.votes - a.votes),
    }));

    return {
      success: true,
      data: {
        election: {
          id: election.id,
          title: election.title,
          status: election.status,
          startDate: election.startDate,
          endDate: election.endDate,
        },
        totalVoters: election._count.voterCodes,
        votesCast: election._count.ballots,
        participationRate: election._count.voterCodes > 0
          ? (election._count.ballots / election._count.voterCodes) * 100
          : 0,
        positionResults,
      },
    };
  } catch (error) {
    console.error("Get election results error:", error);
    return { success: false, error: "Failed to fetch election results" };
  }
}

// Logout voter
export async function logoutVoterAction() {
  await logoutVoter();
  return { success: true };
}

// Get elections open for candidate applications
export async function getElectionsForApplication() {
  const session = await requireVoter();

  try {
    // First, update any election statuses that may have changed
    await updateElectionStatuses();
    
    const now = new Date();
    const normalizedMemberCode = session.memberCode.replace(/\s+/g, '').toUpperCase().trim();
    
    // Find all elections the member has access to
    const accessibleElectionIds = new Set<string>();
    
    // Add election from session if exists
    if (session.electionId) {
      accessibleElectionIds.add(session.electionId);
    }

    // Also check for voter codes with matching member code (same org)
    const memberVoterCodes = await db.voterCode.findMany({
      where: {
        code: normalizedMemberCode,
        orgId: session.orgId,
        status: { in: ["UNUSED", "USED"] },
      },
      select: { electionId: true },
    });
    memberVoterCodes.forEach(vc => accessibleElectionIds.add(vc.electionId));
    
    // If still no accessible elections found, try to find via voter code
    if (accessibleElectionIds.size === 0) {
      const voterCode = await db.voterCode.findFirst({
        where: {
          code: normalizedMemberCode,
          orgId: session.orgId,
          status: { in: ["UNUSED", "USED"] },
        },
        select: { electionId: true },
      });
      
      if (voterCode) {
        accessibleElectionIds.add(voterCode.electionId);
        // Update member record for future queries
        await db.member.update({
          where: { id: session.memberId },
          data: { electionId: voterCode.electionId },
        }).catch(err => console.log("Could not update member electionId:", err));
      }
    }

    if (accessibleElectionIds.size === 0) {
      return { success: true, data: [] };
    }

    // Now get elections that match the criteria
    const elections = await db.election.findMany({
      where: {
        id: { in: Array.from(accessibleElectionIds) },
        orgId: session.orgId,
        candidateMethod: "APPLICATION",
        status: { in: ["DRAFT", "ACTIVE"] },
        OR: [
          // Case 1: Both dates are set and we're within the range
          {
            applicationStartDate: { lte: now },
            applicationEndDate: { gte: now },
          },
          // Case 2: Only end date is set (no start date) - applications open until end date
          {
            applicationStartDate: null,
            applicationEndDate: { gte: now },
          },
          // Case 3: Only start date is set and it has passed - applications are open
          {
            applicationStartDate: { lte: now },
            applicationEndDate: null,
          },
          // Case 4: No application dates set - applications always open for DRAFT/ACTIVE
          {
            applicationStartDate: null,
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

    return { success: true, data: elections };
  } catch (error) {
    console.error("Get elections for application error:", error);
    return { success: false, error: "Failed to fetch elections" };
  }
}

// Submit candidate application
export async function submitCandidateApplication(
  electionId: string,
  positionId: string,
  responses: Array<{ fieldId: string; value: string; fileUrl?: string }>
) {
  const session = await requireVoter();
  const ipAddress = await getClientIp();

  try {
    const now = new Date();

    // Verify election accepts applications
    const election = await db.election.findFirst({
      where: {
        id: electionId,
        orgId: session.orgId,
        candidateMethod: "APPLICATION",
        status: { in: ["DRAFT", "ACTIVE"] },
        OR: [
          // Both dates set and within range
          {
            applicationStartDate: { lte: now },
            applicationEndDate: { gte: now },
          },
          // Only end date set
          {
            applicationStartDate: null,
            applicationEndDate: { gte: now },
          },
          // No dates set - allow applications for DRAFT or ACTIVE elections
          {
            applicationStartDate: null,
            applicationEndDate: null,
          },
          // Only start date set
          {
            applicationStartDate: { lte: now },
            applicationEndDate: null,
          },
        ],
      },
      include: {
        positions: true,
        applicationForm: true,
      },
    });

    if (!election) {
      return { success: false, error: "Election not found or applications are closed" };
    }

    // Verify member has access to this election
    const normalizedMemberCode = session.memberCode.replace(/\s+/g, '').toUpperCase().trim();
    
    // Check if member is linked to this election OR has a voter code
    const hasAccess = session.electionId === electionId;
    
    if (!hasAccess) {
      // Check for voter code
      const voterCode = await db.voterCode.findFirst({
        where: {
          electionId: electionId,
          code: normalizedMemberCode,
          orgId: session.orgId,
          status: { in: ["UNUSED", "USED"] },
        },
      });

      if (!voterCode) {
        return { success: false, error: "You do not have permission to apply for this election" };
      }
    }

    // Verify position exists
    const position = election.positions.find(p => p.id === positionId);
    if (!position) {
      return { success: false, error: "Position not found" };
    }

    // Check if user already applied for ANY position in this election
    // (restrict to one position per member per election)
    const existingApplicationInElection = await db.candidateApplication.findFirst({
      where: {
        electionId,
        applicantId: session.memberId,
      },
      include: {
        position: true,
      },
    });

    if (existingApplicationInElection) {
      return { 
        success: false, 
        error: `You have already applied for the position of ${existingApplicationInElection.position.name} in this election. Members can only apply for one position per election.` 
      };
    }

    // Validate required fields
    for (const field of election.applicationForm) {
      if (field.isRequired) {
        const response = responses.find(r => r.fieldId === field.id);
        if (!response || !response.value.trim()) {
          return { success: false, error: `${field.fieldName} is required` };
        }
      }
    }

    // Create application in a transaction to ensure atomicity
    const application = await db.$transaction(async (tx) => {
      // Double-check no duplicate application was created (race condition protection)
      const duplicateCheck = await tx.candidateApplication.findFirst({
        where: {
          electionId,
          positionId,
          applicantId: session.memberId,
        },
      });

      if (duplicateCheck) {
        throw new Error("You have already applied for this position");
      }

      // Create the application
      return await tx.candidateApplication.create({
        data: {
          electionId,
          positionId,
          applicantId: session.memberId,
          status: "PENDING",
          responses: {
            create: responses.map(r => ({
              fieldId: r.fieldId,
              value: r.value,
              fileUrl: r.fileUrl || null,
            })),
          },
        },
      });
    });

    await logSecurityEvent(
      "CANDIDATE_APPLICATION_SUBMITTED",
      `Application submitted for ${position.name} in ${election.title}`,
      ipAddress,
      session.memberId
    );

    revalidatePath("/vote/dashboard");

    return { success: true, data: application };
  } catch (error: any) {
    console.error("Submit candidate application error:", error);
    if (error?.code === 'P2002') {
      return { success: false, error: "You have already applied for this position" };
    }
    if (error?.message) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to submit application" };
  }
}

// Get my applications
export async function getMyApplications() {
  const session = await requireVoter();

  try {
    const applications = await db.candidateApplication.findMany({
      where: {
        applicantId: session.memberId,
      },
      include: {
        election: {
          select: { id: true, title: true, status: true },
        },
        position: {
          select: { id: true, name: true },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return { success: true, data: applications };
  } catch (error) {
    console.error("Get my applications error:", error);
    return { success: false, error: "Failed to fetch applications" };
  }
}

