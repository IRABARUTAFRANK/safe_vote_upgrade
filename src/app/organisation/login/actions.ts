"use server";

import { loginOrgAdminStep1, loginOrgAdminStep2 } from "@/lib/orgAuth";
import {
  checkRateLimit,
  getClientIp,
  validateAndSanitizeInput,
  logSecurityEvent,
  checkSuspiciousActivity,
} from "@/lib/security";

export async function loginOrgAdmin(formData: FormData): Promise<{ 
  success: boolean; 
  error?: string; 
  orgId?: string; 
  memberId?: string 
}> {
  // Rate limiting
  const ipAddress = await getClientIp();
  const rateLimit = await checkRateLimit(ipAddress, "login");
  
  if (!rateLimit.allowed) {
    await logSecurityEvent("RATE_LIMIT_EXCEEDED", `Org login attempt from ${ipAddress}`, ipAddress);
    return {
      success: false,
      error: `Too many login attempts. Please try again in ${Math.ceil((rateLimit.resetTime - Date.now()) / 60000)} minutes.`,
    };
  }

  // Check for suspicious activity
  const isSuspicious = await checkSuspiciousActivity(ipAddress, "login");
  if (isSuspicious) {
    await logSecurityEvent("SUSPICIOUS_ACTIVITY", `Suspicious org login attempt from ${ipAddress}`, ipAddress);
    return { success: false, error: "Login temporarily blocked. Please contact support." };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const orgId = formData.get("orgId") as string;
  const memberId = formData.get("memberId") as string;
  const orgCode = formData.get("orgCode") as string;

  // Step 1: Email and password
  if (email && password && !orgId) {
    const emailValidation = validateAndSanitizeInput(email, {
      type: "email",
      required: true,
    });
    if (!emailValidation.valid) {
      return { success: false, error: emailValidation.error || "Invalid email format" };
    }

    if (!password) {
      return { success: false, error: "Password is required" };
    }

    return await loginOrgAdminStep1(emailValidation.sanitized!, password);
  }

  // Step 2: Organization code verification
  if (orgId && memberId && orgCode) {
    const codeValidation = validateAndSanitizeInput(orgCode, {
      type: "code",
      required: true,
    });
    if (!codeValidation.valid) {
      return { success: false, error: codeValidation.error || "Invalid organization code format" };
    }

    return await loginOrgAdminStep2(orgId, memberId, codeValidation.sanitized!);
  }

  return { success: false, error: "Invalid request" };
}

