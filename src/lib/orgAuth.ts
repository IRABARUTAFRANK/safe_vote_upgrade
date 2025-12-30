import { cookies } from "next/headers";
import { db } from "./db";
import bcrypt from "bcryptjs";
import { checkRateLimit, logSecurityEvent, getClientIp } from "./security";

const ORG_SESSION_COOKIE = "org_admin_session";
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

// Simple session token generation
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export interface OrgAdminSession {
  memberId: string;
  orgId: string;
  email: string;
  fullName: string;
  orgName: string;
  orgStatus: string;
}

// Step 1: Login with email and password
export async function loginOrgAdminStep1(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; orgId?: string; memberId?: string }> {
  try {
    // Rate limiting (checked at action level, but double-check here)
    const ipAddress = await getClientIp();
    const rateLimit = await checkRateLimit(ipAddress, "login");
    
    if (!rateLimit.allowed) {
      await logSecurityEvent("RATE_LIMIT_EXCEEDED", `Org admin login attempt from ${ipAddress}`, ipAddress);
      return {
        success: false,
        error: `Too many login attempts. Please try again later.`,
      };
    }
    // Find member by email with role ORG_ADMIN
    const member = await db.member.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        role: "ORG_ADMIN",
      },
      include: {
        organisation: true,
      },
    });

    if (!member) {
      return { success: false, error: "Invalid credentials" };
    }

    if (!member.passwordHash) {
      return { success: false, error: "Password not set for this account" };
    }

    // Verify password
    const isValid = await bcrypt.compare(password, member.passwordHash);

    if (!isValid) {
      return { success: false, error: "Invalid credentials" };
    }

    // Check organization status - if not approved, redirect to pending page
    if (member.organisation.status === "REJECTED") {
      return { success: false, error: "Your organization has been rejected. Please contact support." };
    }
    
    // If pending, still allow login but they'll be redirected to pending page

    // Return orgId and memberId for step 2 (org code verification)
    return {
      success: true,
      orgId: member.orgId,
      memberId: member.id,
    };
  } catch (error) {
    console.error("Login step 1 error:", error);
    return { success: false, error: "An error occurred during login" };
  }
}

// Step 2: Verify organization code and create session
export async function loginOrgAdminStep2(
  orgId: string,
  memberId: string,
  orgCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find organization and member
    const organisation = await db.organisation.findUnique({
      where: { id: orgId },
      include: {
        members: {
          where: { id: memberId, role: "ORG_ADMIN" },
        },
      },
    });

    if (!organisation || organisation.members.length === 0) {
      return { success: false, error: "Invalid organization or member" };
    }

    const member = organisation.members[0];

    // Check organization status
    if (organisation.status === "REJECTED") {
      return { success: false, error: "Your organization has been rejected" };
    }

    // Verify organization code
    if (!organisation.orgCode || organisation.orgCode.toUpperCase() !== orgCode.toUpperCase().trim()) {
      return { success: false, error: "Invalid organization code" };
    }

    // Generate session token
    const sessionToken = generateSessionToken();

    // Set session cookie with memberId and orgId
    const cookieStore = await cookies();
    cookieStore.set(ORG_SESSION_COOKIE, `${memberId}:${orgId}:${sessionToken}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION / 1000,
    });

    return { success: true };
  } catch (error) {
    console.error("Login step 2 error:", error);
    return { success: false, error: "An error occurred during login" };
  }
}

// Get current organization admin session
export async function getOrgAdminSession(): Promise<OrgAdminSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ORG_SESSION_COOKIE);

    if (!sessionCookie?.value) {
      return null;
    }

    const [memberId, orgId] = sessionCookie.value.split(":");

    if (!memberId || !orgId) {
      return null;
    }

    const member = await db.member.findUnique({
      where: { id: memberId },
      include: {
        organisation: true,
      },
    });

    if (!member || member.role !== "ORG_ADMIN" || member.orgId !== orgId) {
      return null;
    }

    return {
      memberId: member.id,
      orgId: member.orgId,
      email: member.email || "",
      fullName: member.fullName,
      orgName: member.organisation.name,
      orgStatus: member.organisation.status,
    };
  } catch {
    return null;
  }
}

// Logout organization admin
export async function logoutOrgAdmin(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(ORG_SESSION_COOKIE);
  } catch (error) {
    console.error("Logout error:", error);
  }
}

// Require organization admin authentication
export async function requireOrgAdmin(): Promise<OrgAdminSession> {
  const session = await getOrgAdminSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }
  
  // Check if organization is approved
  if (session.orgStatus !== "APPROVED") {
    throw new Error("Organization not approved");
  }
  
  return session;
}

