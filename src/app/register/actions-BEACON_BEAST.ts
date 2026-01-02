"use server";

import { db } from "@/lib/db";
import { generateOrgCode, generateMemberCode, extractOrgIdentity } from '@/lib/orgCode';
import bcrypt from "bcryptjs";
import {
  checkRateLimit,
  getClientIp,
  validateAndSanitizeInput,
  validatePasswordStrength,
  logSecurityEvent,
  checkSuspiciousActivity,
} from "@/lib/security";

export async function registerOrganisation(formData: FormData) {
  // Rate limiting
  const ipAddress = await getClientIp();
  const rateLimit = await checkRateLimit(ipAddress, "registration");
  
  if (!rateLimit.allowed) {
    await logSecurityEvent("RATE_LIMIT_EXCEEDED", `Registration attempt from ${ipAddress}`, ipAddress);
    return {
      success: false,
      error: `Too many registration attempts. Please try again in ${Math.ceil((rateLimit.resetTime - Date.now()) / 60000)} minutes.`,
    };
  }

  // Check for suspicious activity
  const isSuspicious = await checkSuspiciousActivity(ipAddress, "registration");
  if (isSuspicious) {
    await logSecurityEvent("SUSPICIOUS_ACTIVITY", `Suspicious registration attempt from ${ipAddress}`, ipAddress);
    return { success: false, error: "Registration temporarily blocked. Please contact support." };
  }

  const org_name = (formData.get("org_name") as string) || "";
  const full_name = (formData.get("full_name") as string) || "";
  const contact_email = (formData.get("contact_email") as string) || "";
  const org_type = (formData.get("org_type") as string) || undefined;
  const password = (formData.get("password") as string) || "";

  // Validate and sanitize inputs
  const orgNameValidation = validateAndSanitizeInput(org_name, {
    type: "text",
    maxLength: 200,
    required: true,
  });
  if (!orgNameValidation.valid) {
    return { success: false, error: orgNameValidation.error || "Invalid organization name" };
  }

  const fullNameValidation = validateAndSanitizeInput(full_name, {
    type: "name",
    required: true,
  });
  if (!fullNameValidation.valid) {
    return { success: false, error: fullNameValidation.error || "Invalid name" };
  }

  const emailValidation = validateAndSanitizeInput(contact_email, {
    type: "email",
    required: true,
  });
  if (!emailValidation.valid) {
    return { success: false, error: emailValidation.error || "Invalid email" };
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    return { success: false, error: passwordValidation.errors.join(". ") };
  }
  
  // Hash the password
  const passwordHash = await bcrypt.hash(password, 10);
  
  try {
    const MAX_RETRIES = 6;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const orgCode = generateOrgCode();
      try {
        const result = await db.$transaction(async (tx) => {
          const organisation = await tx.organisation.create({
            data: {
              name: orgNameValidation.sanitized!,
              email: emailValidation.sanitized!,
              orgCode,
              ...(org_type ? { type: org_type } : {}),
              status: "PENDING",
            },
          });

          // Generate member code using org identity
          const orgIdentity = extractOrgIdentity(orgCode);
          let memberCode = generateMemberCode(orgIdentity);
          
          // Ensure member code is unique (retry if collision)
          let memberCodeRetries = 0;
          while (memberCodeRetries < 10) {
            const existing = await tx.member.findUnique({ where: { memberCode } });
            if (!existing) break;
            memberCode = generateMemberCode(orgIdentity);
            memberCodeRetries++;
          }

          await tx.member.create({
            data: {
              orgId: organisation.id,
              fullName: fullNameValidation.sanitized!,
              email: emailValidation.sanitized!,
              passwordHash: passwordHash,
              memberCode,
              role: "ORG_ADMIN",
            },
          });

          return organisation;
        });

        return { success: true, data: result };
      } catch (err: any) {
        // If the orgCode collides, Prisma returns a P2002 for unique constraint
        if (err?.code === 'P2002' && err?.meta?.target && String(err.meta.target).includes('orgCode')) {
          // retry with a new code
          console.warn('Org code collision, retrying...', attempt + 1);
          continue;
        }
        throw err;
      }
    }

    return { success: false, error: 'Unable to generate unique organisation code; please try again.' };
  } catch (error: any) {
    console.error("Registration Error:", error);
    console.error("Registration Error meta:", error?.meta || null);
    if (error?.code === 'P2002') return { success: false, error: "Unique constraint violation (duplicate value)." };
    if (error?.code === 'P2011') {
      const missing = error?.meta?.target || error?.meta?.field_name || error?.meta?.fields || null;
      const fields = Array.isArray(missing) ? missing.join(', ') : missing;
      const msg = fields ? `A required database field was null or missing: ${fields}` : 'A required database field was null or missing.';
      return { success: false, error: msg };
    }

    return { success: false, error: "Database operation failed." };
  }
}