"use server";

import { db } from "@/lib/db";
import { requireSuperAdmin, logAdminAction, logoutSuperAdmin } from "@/lib/auth";
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
  const ipAddress = await getClientIp();

  // Validate orgId
  const orgIdValidation = validateAndSanitizeInput(orgId, {
    type: "text",
    maxLength: 100,
    required: true,
  });
  if (!orgIdValidation.valid) {
    return { success: false, error: "Invalid organization ID" };
  }

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
  const ipAddress = await getClientIp();

  // Rate limiting for code generation
  const rateLimit = await checkRateLimit(`${session.id}:${orgId}`, "codeGeneration");
  if (!rateLimit.allowed) {
    await logSecurityEvent("RATE_LIMIT_EXCEEDED", `Code generation attempt for org ${orgId}`, ipAddress, session.id);
    return {
      success: false,
      error: `Too many code generation attempts. Please try again later.`,
    };
  }

  // Validate orgId
  const orgIdValidation = validateAndSanitizeInput(orgId, {
    type: "text",
    maxLength: 100,
    required: true,
  });
  if (!orgIdValidation.valid) {
    return { success: false, error: "Invalid organization ID" };
  }

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
  const ipAddress = await getClientIp();

  // Validate orgId
  const orgIdValidation = validateAndSanitizeInput(orgId, {
    type: "text",
    maxLength: 100,
    required: true,
  });
  if (!orgIdValidation.valid) {
    return { success: false, error: "Invalid organization ID" };
  }

  // Sanitize reason if provided
  let sanitizedReason: string | undefined;
  if (reason) {
    const reasonValidation = validateAndSanitizeInput(reason, {
      type: "text",
      maxLength: 500,
      required: false,
    });
    sanitizedReason = reasonValidation.sanitized;
  }

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
      `Rejected organisation: ${org.name}. Reason: ${sanitizedReason || "Not specified"}`,
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
  const ipAddress = await getClientIp();

  // Validate orgId
  const orgIdValidation = validateAndSanitizeInput(orgId, {
    type: "text",
    maxLength: 100,
    required: true,
  });
  if (!orgIdValidation.valid) {
    return { success: false, error: "Invalid organization ID" };
  }

  try {
    const organisation = await db.organisation.findUnique({
      where: { id: orgId },
      include: {
        members: {
          where: { role: "ORG_ADMIN" },
          take: 1,
        },
      },
    });

    if (!organisation) {
      return { success: false, error: "Organisation not found" };
    }

    if (!organisation.orgCode) {
      return { success: false, error: "Organisation code not generated yet" };
    }

    // In a real application, you would use an email service like SendGrid, Resend, etc.
    // For now, we'll log it and return success
    console.log(`Email would be sent to ${organisation.email} with org code: ${organisation.orgCode}`);
    
    // TODO: Implement actual email sending
    // Example with a service like Resend:
    // await resend.emails.send({
    //   from: 'SafeVote <noreply@safevote.com>',
    //   to: organisation.email,
    //   subject: 'Your SafeVote Organization Code',
    //   html: `Your organization code is: <strong>${organisation.orgCode}</strong>`
    // });

    await logAdminAction(
      session.id,
      "SEND_ORG_CODE_EMAIL",
      "Organisation",
      orgId,
      `Sent organization code via email to: ${organisation.email}`,
      ipAddress
    );

    revalidatePath("/superadmin/dashboard");
    revalidatePath(`/superadmin/dashboard/org/${orgId}`);
    return { success: true };
  } catch (error) {
    console.error("Send email error:", error);
    return { success: false, error: "Failed to send email" };
  }
}
