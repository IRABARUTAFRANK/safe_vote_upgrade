"use server";

import { db } from "@/lib/db";
import { requireSuperAdmin, logAdminAction, logoutSuperAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { generateOrgCode } from '@/lib/orgCode';
import {
  checkRateLimit,
  getClientIp,
  logSecurityEvent,
  validateAndSanitizeInput,
} from "@/lib/security";

export async function approveOrganisation(orgId: string) {
  const session = await requireSuperAdmin();
  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for") || "unknown";

  try {
    // Fetch current organisation to see if it already has a code
    const existing = await db.organisation.findUnique({ where: { id: orgId } });
    if (!existing) return { success: false, error: 'Organisation not found' };

    // If org already has a code, just approve
    if (existing.orgCode) {
      const org = await db.organisation.update({ where: { id: orgId }, data: { status: 'APPROVED' } });

      await logAdminAction(
        session.id,
        "APPROVE_ORG",
        "Organisation",
        orgId,
        `Approved organisation (existing code): ${org.name}`,
        ipAddress
      );

      revalidatePath("/superadmin/dashboard");
      return { success: true };
    }

    // Otherwise, generate and persist a unique orgCode with retries
    const MAX_RETRIES = 6;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const orgCode = generateOrgCode();
      try {
        const org = await db.organisation.update({
          where: { id: orgId },
          data: { status: 'APPROVED', orgCode },
        });

        await logAdminAction(
          session.id,
          "APPROVE_ORG",
          "Organisation",
          orgId,
          `Approved organisation and generated orgCode ${orgCode} for: ${org.name}`,
          ipAddress
        );

        revalidatePath("/superadmin/dashboard");
        revalidatePath(`/superadmin/dashboard/org/${orgId}`);
        return { success: true };
      } catch (err: any) {
        if (err?.code === 'P2002' && err?.meta?.target && String(err.meta.target).includes('orgCode')) {
          // collision: try again
          continue;
        }
        throw err;
      }
    }

    return { success: false, error: 'Failed to generate a unique org code.' };
  } catch (error) {
    console.error("Approve error:", error);
    return { success: false, error: "Failed to approve organisation" };
  }
}

export async function generateOrgCodeForOrg(orgId: string) {
  const session = await requireSuperAdmin();
  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for") || "unknown";

  try {
    const existing = await db.organisation.findUnique({ where: { id: orgId } });
    if (!existing) return { success: false, error: 'Organisation not found' };
    if (existing.orgCode) return { success: false, error: 'Organisation already has an orgCode' };

    const MAX_RETRIES = 6;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const orgCode = generateOrgCode();
      try {
        const org = await db.organisation.update({
          where: { id: orgId },
          data: { orgCode },
        });

        await logAdminAction(
          session.id,
          "GENERATE_ORG_CODE",
          "Organisation",
          orgId,
          `Generated orgCode ${orgCode} for: ${org.name}`,
          ipAddress
        );

        revalidatePath("/superadmin/dashboard");
        revalidatePath(`/superadmin/dashboard/org/${orgId}`);
        return { success: true, data: orgCode };
      } catch (err: any) {
        if (err?.code === 'P2002' && err?.meta?.target && String(err.meta.target).includes('orgCode')) {
          // collision: try again
          continue;
        }
        throw err;
      }
    }

    return { success: false, error: 'Failed to generate a unique org code.' };
  } catch (error) {
    console.error("Generate code error:", error);
    return { success: false, error: "Failed to generate org code" };
  }
}

export async function rejectOrganisation(orgId: string, reason?: string) {
  const session = await requireSuperAdmin();
  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for") || "unknown";

  try {
    const org = await db.organisation.update({
      where: { id: orgId },
      data: { status: "REJECTED" },
    });

    await logAdminAction(
      session.id,
      "REJECT_ORG",
      "Organisation",
      orgId,
      `Rejected organisation: ${org.name}. Reason: ${reason || "Not specified"}`,
      ipAddress
    );

    revalidatePath("/superadmin/dashboard");
    revalidatePath(`/superadmin/dashboard/org/${orgId}`);
    return { success: true };
  } catch (error) {
    console.error("Reject error:", error);
    return { success: false, error: "Failed to reject organisation" };
  }
}

export async function handleLogout() {
  await logoutSuperAdmin();
  return { success: true };
}

export async function getOrganisations(status?: string) {
  await requireSuperAdmin();

  const where = status ? { status: status as any } : {};

  const organisations = await db.organisation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { members: true, elections: true } },
    },
  });

  return organisations;
}

export async function getOrganisationDetails(orgId: string) {
  await requireSuperAdmin();

  const organisation = await db.organisation.findUnique({
    where: { id: orgId },
    include: {
      _count: { select: { members: true, elections: true } },
      members: {
        take: 10,
        orderBy: { fullName: "asc" },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          memberCode: true,
        },
      },
      elections: {
        take: 10,
        orderBy: { startDate: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          startDate: true,
          endDate: true,
        },
      },
    },
  });

  if (!organisation) {
    return { success: false, error: "Organisation not found" };
  }

  return { success: true, data: organisation };
}

export async function sendOrgCodeEmail(orgId: string) {
  const session = await requireSuperAdmin();
  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for") || "unknown";

  try {
    const organisation = await db.organisation.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        email: true,
        orgCode: true,
      },
    });

    if (!organisation) {
      return { success: false, error: "Organisation not found" };
    }

    if (!organisation.orgCode) {
      return { success: false, error: "Organisation does not have an org code yet" };
    }

    if (!organisation.email) {
      return { success: false, error: "Organisation does not have an email address" };
    }

    // TODO: Implement email sending functionality
    // For now, we'll log the action and return success
    // In production, integrate with an email service like SendGrid, Resend, or AWS SES
    
    console.log(`[EMAIL] Would send org code ${organisation.orgCode} to ${organisation.email} for organisation ${organisation.name}`);
    
    // Log the action
    await logAdminAction(
      session.id,
      "SEND_ORG_CODE_EMAIL",
      "Organisation",
      orgId,
      `Sent org code email to ${organisation.email} for: ${organisation.name}`,
      ipAddress
    );

    revalidatePath("/superadmin/dashboard");
    revalidatePath(`/superadmin/dashboard/org/${orgId}`);

    // Return success (email functionality can be added later)
    return { 
      success: true, 
      message: `Organization code would be sent to ${organisation.email}. Email functionality needs to be configured.` 
    };
  } catch (error) {
    console.error("Send email error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function deleteOrganisation(orgId: string) {
  const session = await requireSuperAdmin();
  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for") || "unknown";

  try {
    // First, get the organisation details for logging
    const organisation = await db.organisation.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            members: true,
            elections: true,
          },
        },
      },
    });

    if (!organisation) {
      return { success: false, error: "Organisation not found" };
    }

    // Delete organisation (cascading deletes will handle related records)
    // Prisma will automatically delete related records due to onDelete: Cascade
    // But we need to delete in the right order to avoid foreign key constraints
    
    await db.$transaction(async (tx) => {
      // Delete all related records first
      // Delete ballots (through elections)
      await tx.ballot.deleteMany({
        where: {
          election: {
            orgId: orgId,
          },
        },
      });

      // Delete votes (through positions -> elections)
      await tx.vote.deleteMany({
        where: {
          position: {
            election: {
              orgId: orgId,
            },
          },
        },
      });

      // Delete candidates (through positions -> elections)
      await tx.candidate.deleteMany({
        where: {
          position: {
            election: {
              orgId: orgId,
            },
          },
        },
      });

      // Delete positions (through elections)
      await tx.position.deleteMany({
        where: {
          election: {
            orgId: orgId,
          },
        },
      });

      // Delete elections
      await tx.election.deleteMany({
        where: {
          orgId: orgId,
        },
      });

      // Delete audit logs
      await tx.auditLog.deleteMany({
        where: {
          orgId: orgId,
        },
      });

      // Delete members
      await tx.member.deleteMany({
        where: {
          orgId: orgId,
        },
      });

      // Finally, delete the organisation
      await tx.organisation.delete({
        where: { id: orgId },
      });
    });

    // Log the action
    await logAdminAction(
      session.id,
      "DELETE_ORG",
      "Organisation",
      orgId,
      `Deleted organisation: ${organisation.name} (${organisation.email}). Removed ${organisation._count.members} members and ${organisation._count.elections} elections.`,
      ipAddress
    );

    revalidatePath("/superadmin/dashboard");
    
    return { success: true, message: `Organisation "${organisation.name}" has been deleted successfully.` };
  } catch (error) {
    console.error("Delete organisation error:", error);
    return { success: false, error: "Failed to delete organisation" };
  }
}

