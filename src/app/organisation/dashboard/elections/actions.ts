"use server";

import { db } from "@/lib/db";
import { getOrgAdminSession } from "@/lib/orgAuth";
import { generateMemberCodes, extractOrgIdentity } from "@/lib/orgCode";
import { validateAndSanitizeInput } from "@/lib/security";
import { parseLocalDateTime } from "@/lib/dateHelper";
import { revalidatePath } from "next/cache";

export async function createElection(formData: FormData) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const title = (formData.get("title") as string) || "";
  const description = (formData.get("description") as string) || "";
  const startDate = (formData.get("startDate") as string) || "";
  const endDate = (formData.get("endDate") as string) || "";
  const numberOfVoters = (formData.get("numberOfVoters") as string) || "";
  const candidateMethod = (formData.get("candidateMethod") as string) || "MANUAL";
  const applicationStartDate = formData.get("applicationStartDate") as string;
  const applicationEndDate = formData.get("applicationEndDate") as string;
  const showRealTimeResults = formData.get("showRealTimeResults") === "true";

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

  const voterCount = parseInt(numberOfVoters, 10);
  if (isNaN(voterCount) || voterCount < 1 || voterCount > 100000) {
    return { success: false, error: "Number of voters must be between 1 and 100,000" };
  }

  try {
    const organisation = await db.organisation.findUnique({
      where: { id: session.orgId },
      select: { orgCode: true },
    });

    if (!organisation || !organisation.orgCode) {
      return { success: false, error: "Organization code not found" };
    }

    const result = await db.$transaction(async (tx) => {
      const election = await tx.election.create({
        data: {
          orgId: session.orgId,
          title: titleValidation.sanitized!,
          description: description || null,
          startDate: start,
          endDate: end,
          status: "DRAFT",
          numberOfVoters: voterCount,
          candidateMethod: candidateMethod as "MANUAL" | "APPLICATION",
          // Parse datetime-local inputs as local time, not UTC
          applicationStartDate: applicationStartDate ? parseLocalDateTime(applicationStartDate) : null,
          applicationEndDate: applicationEndDate ? parseLocalDateTime(applicationEndDate) : null,
          showRealTimeResults,
        },
      });

      const voterCodes = generateMemberCodes(organisation.orgCode!, voterCount);
      
      const existingCodes = await tx.voterCode.findMany({
        where: { code: { in: voterCodes } },
        select: { code: true },
      });
      const existingCodeSet = new Set(existingCodes.map(c => c.code));
      const uniqueCodes = voterCodes.filter(code => !existingCodeSet.has(code));
      
      let additionalNeeded = voterCount - uniqueCodes.length;
      while (additionalNeeded > 0) {
        const moreCodes = generateMemberCodes(organisation.orgCode!, additionalNeeded * 2);
        for (const code of moreCodes) {
          if (!existingCodeSet.has(code) && !uniqueCodes.includes(code)) {
            uniqueCodes.push(code);
            if (uniqueCodes.length >= voterCount) break;
          }
        }
        additionalNeeded = voterCount - uniqueCodes.length;
      }

      // Create voter codes for the election
      await tx.voterCode.createMany({
        data: uniqueCodes.slice(0, voterCount).map(code => ({
          orgId: session.orgId,
          electionId: election.id,
          code,
          status: "UNUSED",
        })),
      });
      
      // Log the creation for debugging
      console.log(`Created ${uniqueCodes.length} voter codes for election ${election.id}`);

      return election;
    });

    revalidatePath("/organisation/dashboard");
    revalidatePath("/organisation/dashboard/elections");

    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("Create election error:", error);
    return { success: false, error: "Failed to create election" };
  }
}

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
            voterCodes: true,
            applications: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: elections };
  } catch (error) {
    console.error("Get elections error:", error);
    return { success: false, error: "Failed to fetch elections" };
  }
}

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
              orderBy: { displayOrder: "asc" },
            },
            _count: {
              select: { votes: true, applications: true },
            },
          },
          orderBy: { displayOrder: "asc" },
        },
        applicationForm: {
          orderBy: { displayOrder: "asc" },
        },
        _count: {
          select: {
            ballots: true,
            voterCodes: true,
            applications: true,
          },
        },
      },
    });

    if (!election) {
      return { success: false, error: "Election not found" };
    }

    const voterCodeStats = await db.voterCode.groupBy({
      by: ["status"],
      where: { electionId },
      _count: { status: true },
    });

    const applicationStats = await db.candidateApplication.groupBy({
      by: ["status"],
      where: { electionId },
      _count: { status: true },
    });

    return { 
      success: true, 
      data: { 
        ...election, 
        voterCodeStats,
        applicationStats,
      } 
    };
  } catch (error) {
    console.error("Get election details error:", error);
    return { success: false, error: "Failed to fetch election details" };
  }
}

export async function updateElectionSettings(
  electionId: string,
  data: {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    applicationStartDate?: string | null;
    applicationEndDate?: string | null;
    showRealTimeResults?: boolean;
  }
) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Validate title if provided
    if (data.title !== undefined) {
      const titleValidation = validateAndSanitizeInput(data.title, {
        type: "text",
        maxLength: 200,
        required: true,
      });
      if (!titleValidation.valid) {
        return { success: false, error: titleValidation.error || "Invalid title" };
      }
    }

    // Build update object
    const updateData: any = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.applicationStartDate !== undefined) {
      updateData.applicationStartDate = data.applicationStartDate ? parseLocalDateTime(data.applicationStartDate) : null;
    }
    if (data.applicationEndDate !== undefined) {
      updateData.applicationEndDate = data.applicationEndDate ? parseLocalDateTime(data.applicationEndDate) : null;
    }
    if (data.showRealTimeResults !== undefined) updateData.showRealTimeResults = data.showRealTimeResults;

    // Validate dates if both are provided
    if (updateData.startDate && updateData.endDate) {
      if (updateData.startDate >= updateData.endDate) {
        return { success: false, error: "End date must be after start date" };
      }
    }

    const election = await db.election.updateMany({
      where: {
        id: electionId,
        orgId: session.orgId,
      },
      data: updateData,
    });

    if (election.count === 0) {
      return { success: false, error: "Election not found" };
    }

    revalidatePath("/organisation/dashboard");
    revalidatePath(`/organisation/dashboard/elections/${electionId}`);

    return { success: true };
  } catch (error) {
    console.error("Update election settings error:", error);
    return { success: false, error: "Failed to update election settings" };
  }
}

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
      data: { status: status as "DRAFT" | "ACTIVE" | "CLOSED" | "CANCELLED" },
    });

    if (election.count === 0) {
      return { success: false, error: "Election not found" };
    }

    // If election is CLOSED or CANCELLED, mark all member accounts linked to it as dormant
    // This preserves the data but prevents access after election ends
    if (status === "CLOSED" || status === "CANCELLED") {
      await db.member.updateMany({
        where: {
          electionId: electionId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    }

    // If election is being reactivated (from CLOSED to ACTIVE), reactivate member accounts
    if (status === "ACTIVE") {
      await db.member.updateMany({
        where: {
          electionId: electionId,
          isActive: false,
        },
        data: {
          isActive: true,
        },
      });
    }

    revalidatePath("/organisation/dashboard");
    revalidatePath(`/organisation/dashboard/elections/${electionId}`);

    return { success: true };
  } catch (error) {
    console.error("Update election status error:", error);
    return { success: false, error: "Failed to update election status" };
  }
}

export async function toggleRealTimeResults(electionId: string, showRealTimeResults: boolean) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const election = await db.election.updateMany({
      where: {
        id: electionId,
        orgId: session.orgId,
      },
      data: { showRealTimeResults },
    });

    if (election.count === 0) {
      return { success: false, error: "Election not found" };
    }

    revalidatePath(`/organisation/dashboard/elections/${electionId}`);

    return { success: true };
  } catch (error) {
    console.error("Toggle real-time results error:", error);
    return { success: false, error: "Failed to update setting" };
  }
}

export async function addPosition(
  electionId: string, 
  data: { 
    name: string; 
    description?: string; 
    maxWinners?: number;
    minVotes?: number;
    maxVotes?: number;
  }
) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const nameValidation = validateAndSanitizeInput(data.name, {
    type: "text",
    maxLength: 100,
    required: true,
  });
  if (!nameValidation.valid) {
    return { success: false, error: nameValidation.error || "Invalid position name" };
  }

  try {
    const election = await db.election.findFirst({
      where: {
        id: electionId,
        orgId: session.orgId,
      },
      include: { _count: { select: { positions: true } } },
    });

    if (!election) {
      return { success: false, error: "Election not found" };
    }

    const position = await db.position.create({
      data: {
        electionId,
        name: nameValidation.sanitized!,
        description: data.description || null,
        maxWinners: data.maxWinners || 1,
        minVotes: data.minVotes || 1,
        maxVotes: data.maxVotes || 1,
        displayOrder: election._count.positions,
      },
    });

    revalidatePath(`/organisation/dashboard/elections/${electionId}`);

    return { success: true, data: position };
  } catch (error) {
    console.error("Add position error:", error);
    return { success: false, error: "Failed to add position" };
  }
}

export async function updatePosition(
  positionId: string,
  data: { 
    name?: string; 
    description?: string; 
    maxWinners?: number;
    minVotes?: number;
    maxVotes?: number;
  }
) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const position = await db.position.findFirst({
      where: { id: positionId },
      include: { election: true },
    });

    if (!position || position.election.orgId !== session.orgId) {
      return { success: false, error: "Position not found" };
    }

    const updated = await db.position.update({
      where: { id: positionId },
      data: {
        name: data.name,
        description: data.description,
        maxWinners: data.maxWinners,
        minVotes: data.minVotes,
        maxVotes: data.maxVotes,
      },
    });

    revalidatePath(`/organisation/dashboard/elections/${position.electionId}`);

    return { success: true, data: updated };
  } catch (error) {
    console.error("Update position error:", error);
    return { success: false, error: "Failed to update position" };
  }
}

export async function deletePosition(positionId: string) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const position = await db.position.findFirst({
      where: { id: positionId },
      include: { election: true },
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

export async function addCandidate(
  positionId: string, 
  data: {
    name: string;
    bio?: string;
    manifesto?: string;
    photoUrl?: string;
  }
) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const nameValidation = validateAndSanitizeInput(data.name, {
    type: "text",
    maxLength: 100,
    required: true,
  });
  if (!nameValidation.valid) {
    return { success: false, error: nameValidation.error || "Invalid candidate name" };
  }

  try {
    const position = await db.position.findFirst({
      where: { id: positionId },
      include: { 
        election: true,
        _count: { select: { candidates: true } },
      },
    });

    if (!position || position.election.orgId !== session.orgId) {
      return { success: false, error: "Position not found" };
    }

    const candidate = await db.candidate.create({
      data: {
        positionId,
        name: nameValidation.sanitized!,
        bio: data.bio || null,
        manifesto: data.manifesto || null,
        photoUrl: data.photoUrl || null,
        isApproved: true,
        displayOrder: position._count.candidates,
      },
    });

    revalidatePath(`/organisation/dashboard/elections/${position.electionId}`);

    return { success: true, data: candidate };
  } catch (error) {
    console.error("Add candidate error:", error);
    return { success: false, error: "Failed to add candidate" };
  }
}

export async function updateCandidate(
  candidateId: string,
  data: {
    name?: string;
    bio?: string;
    manifesto?: string;
    photoUrl?: string;
  }
) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const candidate = await db.candidate.findFirst({
      where: { id: candidateId },
      include: { position: { include: { election: true } } },
    });

    if (!candidate || candidate.position.election.orgId !== session.orgId) {
      return { success: false, error: "Candidate not found" };
    }

    const updated = await db.candidate.update({
      where: { id: candidateId },
      data: {
        name: data.name,
        bio: data.bio,
        manifesto: data.manifesto,
        photoUrl: data.photoUrl,
      },
    });

    revalidatePath(`/organisation/dashboard/elections/${candidate.position.electionId}`);

    return { success: true, data: updated };
  } catch (error) {
    console.error("Update candidate error:", error);
    return { success: false, error: "Failed to update candidate" };
  }
}

export async function deleteCandidate(candidateId: string) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const candidate = await db.candidate.findFirst({
      where: { id: candidateId },
      include: { position: { include: { election: true } } },
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

export async function addApplicationFormField(
  electionId: string,
  data: {
    fieldName: string;
    fieldType: string;
    isRequired: boolean;
    options?: string;
    placeholder?: string;
  }
) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const election = await db.election.findFirst({
      where: { id: electionId, orgId: session.orgId },
      include: { _count: { select: { applicationForm: true } } },
    });

    if (!election) {
      return { success: false, error: "Election not found" };
    }

    const field = await db.applicationFormField.create({
      data: {
        electionId,
        fieldName: data.fieldName,
        fieldType: data.fieldType,
        isRequired: data.isRequired,
        options: data.options || null,
        placeholder: data.placeholder || null,
        displayOrder: election._count.applicationForm,
      },
    });

    revalidatePath(`/organisation/dashboard/elections/${electionId}`);

    return { success: true, data: field };
  } catch (error) {
    console.error("Add form field error:", error);
    return { success: false, error: "Failed to add form field" };
  }
}

export async function deleteApplicationFormField(fieldId: string) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const field = await db.applicationFormField.findFirst({
      where: { id: fieldId },
      include: { election: true },
    });

    if (!field || field.election.orgId !== session.orgId) {
      return { success: false, error: "Field not found" };
    }

    await db.applicationFormField.delete({
      where: { id: fieldId },
    });

    revalidatePath(`/organisation/dashboard/elections/${field.electionId}`);

    return { success: true };
  } catch (error) {
    console.error("Delete form field error:", error);
    return { success: false, error: "Failed to delete form field" };
  }
}

export async function getVoterCodes(electionId: string) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const election = await db.election.findFirst({
      where: { id: electionId, orgId: session.orgId },
    });

    if (!election) {
      return { success: false, error: "Election not found" };
    }

    const codes = await db.voterCode.findMany({
      where: { electionId },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, data: codes };
  } catch (error) {
    console.error("Get voter codes error:", error);
    return { success: false, error: "Failed to fetch voter codes" };
  }
}

export async function generateAdditionalVoterCodes(electionId: string, count: number) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  if (count < 1 || count > 10000) {
    return { success: false, error: "Count must be between 1 and 10,000" };
  }

  try {
    const election = await db.election.findFirst({
      where: { id: electionId, orgId: session.orgId },
    });

    if (!election) {
      return { success: false, error: "Election not found" };
    }

    const organisation = await db.organisation.findUnique({
      where: { id: session.orgId },
      select: { orgCode: true },
    });

    if (!organisation?.orgCode) {
      return { success: false, error: "Organization code not found" };
    }

    const voterCodes = generateMemberCodes(organisation.orgCode, count * 2);
    
    const existingCodes = await db.voterCode.findMany({
      where: { code: { in: voterCodes } },
      select: { code: true },
    });
    const existingCodeSet = new Set(existingCodes.map(c => c.code));
    const uniqueCodes = voterCodes.filter(code => !existingCodeSet.has(code)).slice(0, count);

    await db.voterCode.createMany({
      data: uniqueCodes.map(code => ({
        orgId: session.orgId,
        electionId,
        code,
        status: "UNUSED",
      })),
    });

    await db.election.update({
      where: { id: electionId },
      data: { numberOfVoters: { increment: uniqueCodes.length } },
    });

    revalidatePath(`/organisation/dashboard/elections/${electionId}`);

    return { success: true, data: { generated: uniqueCodes.length } };
  } catch (error) {
    console.error("Generate voter codes error:", error);
    return { success: false, error: "Failed to generate voter codes" };
  }
}

export async function markCodesAsPrinted(electionId: string, codeIds: string[]) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await db.voterCode.updateMany({
      where: {
        id: { in: codeIds },
        electionId,
        election: { orgId: session.orgId },
      },
      data: { printedAt: new Date() },
    });

    revalidatePath(`/organisation/dashboard/elections/${electionId}`);

    return { success: true };
  } catch (error) {
    console.error("Mark codes as printed error:", error);
    return { success: false, error: "Failed to mark codes as printed" };
  }
}

export async function getApplications(electionId: string, status?: string) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const election = await db.election.findFirst({
      where: { id: electionId, orgId: session.orgId },
    });

    if (!election) {
      return { success: false, error: "Election not found" };
    }

    const applications = await db.candidateApplication.findMany({
      where: {
        electionId,
        ...(status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" } : {}),
      },
      include: {
        position: true,
        applicant: {
          select: { id: true, fullName: true, email: true, memberCode: true },
        },
        responses: {
          include: { field: true },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return { success: true, data: applications };
  } catch (error) {
    console.error("Get applications error:", error);
    return { success: false, error: "Failed to fetch applications" };
  }
}

export async function reviewApplication(
  applicationId: string,
  decision: "APPROVED" | "REJECTED",
  reviewNotes?: string
) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const application = await db.candidateApplication.findFirst({
      where: { id: applicationId },
      include: { 
        election: true,
        position: { include: { _count: { select: { candidates: true } } } },
        applicant: true,
        responses: {
          include: { field: true },
        },
      },
    });

    if (!application || application.election.orgId !== session.orgId) {
      return { success: false, error: "Application not found" };
    }

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.candidateApplication.update({
        where: { id: applicationId },
        data: {
          status: decision,
          reviewNotes: reviewNotes || null,
          reviewedAt: new Date(),
          reviewedBy: session.memberId,
        },
      });

      if (decision === "APPROVED") {
        await tx.candidate.create({
          data: {
            positionId: application.positionId,
            name: application.applicant.fullName,
            bio: application.responses.find(r => r.field?.fieldName === "Bio")?.value || null,
            manifesto: application.responses.find(r => r.field?.fieldName === "Manifesto")?.value || null,
            photoUrl: application.responses.find(r => r.field?.fieldType === "file")?.fileUrl || null,
            isApproved: true,
            displayOrder: application.position._count.candidates,
            applicationId: application.id,
          },
        });
      }

      return updated;
    });

    revalidatePath(`/organisation/dashboard/elections/${application.electionId}`);
    revalidatePath(`/organisation/dashboard/applications`);

    return { success: true, data: result };
  } catch (error) {
    console.error("Review application error:", error);
    return { success: false, error: "Failed to review application" };
  }
}

export async function getElectionStats(electionId: string) {
  const session = await getOrgAdminSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const election = await db.election.findFirst({
      where: { id: electionId, orgId: session.orgId },
      include: {
        positions: {
          include: {
            candidates: {
              include: {
                _count: { select: { votes: true } },
              },
            },
            _count: { select: { votes: true } },
          },
        },
        _count: { select: { ballots: true, voterCodes: true } },
      },
    });

    if (!election) {
      return { success: false, error: "Election not found" };
    }

    const usedCodes = await db.voterCode.count({
      where: { electionId, status: "USED" },
    });

    const positionResults = election.positions.map(pos => ({
      id: pos.id,
      name: pos.name,
      maxWinners: pos.maxWinners,
      totalVotes: pos._count.votes,
      candidates: pos.candidates
        .map(c => ({
          id: c.id,
          name: c.name,
          photoUrl: c.photoUrl,
          votes: c._count.votes,
          percentage: pos._count.votes > 0 ? (c._count.votes / pos._count.votes) * 100 : 0,
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
        usedCodes,
        participationRate: election._count.voterCodes > 0 
          ? (usedCodes / election._count.voterCodes) * 100 
          : 0,
        positionResults,
      },
    };
  } catch (error) {
    console.error("Get election stats error:", error);
    return { success: false, error: "Failed to fetch election statistics" };
  }
}
