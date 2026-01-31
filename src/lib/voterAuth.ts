"use server";

import { cookies } from "next/headers";
import { db } from "./db";
import bcrypt from "bcryptjs";
import { checkRateLimit, logSecurityEvent, getClientIp, validateAndSanitizeInput, validatePasswordStrength } from "./security";

const VOTER_SESSION_COOKIE = "voter_session";
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

// Simple session token generation
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * CENTRALIZED code normalization - use this everywhere!
 * Removes all whitespace, converts to uppercase, and trims
 */
export function normalizeCode(code: string): string {
  if (!code || typeof code !== 'string') return '';
  return code.replace(/\s+/g, '').toUpperCase().trim();
}

export interface VoterSession {
  memberId: string;
  orgId: string;
  electionId: string | null;
  email: string | null;
  fullName: string;
  memberCode: string;
  orgName: string;
  isActive: boolean;
  createdAt: Date;
}

export interface CodeValidationResult {
  success: boolean;
  error?: string;
  memberCode?: string;
  orgId?: string;
  hasAccount: boolean;
  memberId?: string;
  fullName?: string;
  email?: string | null;
  electionTitle?: string;
  orgName?: string;
}

// Step 1: Validate member code and check if account exists
export async function validateMemberCode(
  memberCode: string
): Promise<CodeValidationResult> {
  try {
    const ipAddress = await getClientIp();
    
    // Rate limiting
    const rateLimit = await checkRateLimit(`${ipAddress}:code_validation`, "login");
    if (!rateLimit.allowed) {
      await logSecurityEvent("RATE_LIMIT_EXCEEDED", `Member code validation attempt from ${ipAddress}`, ipAddress);
      return {
        success: false,
        hasAccount: false,
        error: `Too many attempts. Please try again in ${Math.ceil((rateLimit.resetTime - Date.now()) / 60000)} minutes.`,
      };
    }

    // Basic validation
    if (!memberCode || memberCode.trim().length === 0) {
      return { success: false, hasAccount: false, error: "Please enter your voter code" };
    }

    // CRITICAL: Use centralized normalization
    const sanitizedCode = normalizeCode(memberCode);

    if (sanitizedCode.length < 3 || sanitizedCode.length > 10) {
      return { success: false, hasAccount: false, error: "Invalid voter code format" };
    }

    // FIRST: Check if member account already exists
    const member = await db.member.findUnique({
      where: { memberCode: sanitizedCode },
      include: {
        organisation: true,
        election: true,
      },
    });

    if (member) {
      // Check if organization is approved
      if (member.organisation.status !== "APPROVED") {
        return { 
          success: false, 
          hasAccount: false, 
          error: "Your organization is not yet approved. Please contact your administrator." 
        };
      }

      // Member exists - allow login
      return {
        success: true,
        memberCode: sanitizedCode,
        orgId: member.orgId,
        hasAccount: true,
        memberId: member.id,
        fullName: member.fullName,
        email: member.email,
        orgName: member.organisation.name,
        electionTitle: member.election?.title,
      };
    }

    // SECOND: Check if code exists as VoterCode (for new account creation)
    // Only accept UNUSED codes for new account creation
    const voterCode = await db.voterCode.findFirst({
      where: {
        code: sanitizedCode,
        status: "UNUSED",
      },
      include: {
        election: {
          include: {
            organisation: true,
          },
        },
        organisation: true,
      },
    });

    if (voterCode) {
      // Check if organization is approved
      if (voterCode.organisation.status !== "APPROVED") {
        return { 
          success: false, 
          hasAccount: false, 
          error: "Your organization is not yet approved. Please contact your administrator." 
        };
      }

      // Check if election is valid
      if (!voterCode.election) {
        return { 
          success: false, 
          hasAccount: false, 
          error: "This voter code is not associated with any election." 
        };
      }

      // Code is valid and UNUSED - allow account creation
      return {
        success: true,
        memberCode: sanitizedCode,
        orgId: voterCode.orgId,
        hasAccount: false,
        fullName: "",
        email: null,
        orgName: voterCode.organisation.name,
        electionTitle: voterCode.election.title,
      };
    }

    // Check if code exists but is USED (different error message)
    const usedCode = await db.voterCode.findFirst({
      where: {
        code: sanitizedCode,
        status: "USED",
      },
    });

    if (usedCode) {
      // Code is used but no member found - data inconsistency
      // Provide helpful error message
      await logSecurityEvent("USED_CODE_NO_MEMBER", `Used code without member: ${sanitizedCode}`, ipAddress);
      return { 
        success: false, 
        hasAccount: false, 
        error: "This code has already been used. If you believe this is an error, please contact your organization administrator." 
      };
    }

    // Code not found at all
    await logSecurityEvent("INVALID_MEMBER_CODE", `Invalid member code attempt: ${sanitizedCode}`, ipAddress);
    return { success: false, hasAccount: false, error: "Invalid voter code. Please check and try again." };
  } catch (error) {
    console.error("Validate member code error:", error);
    return { success: false, hasAccount: false, error: "An error occurred while validating your code" };
  }
}

// Step 2a: Login with existing account
export async function loginWithPassword(
  memberCode: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ipAddress = await getClientIp();

    // Rate limiting
    const rateLimit = await checkRateLimit(`${ipAddress}:voter_login`, "login");
    if (!rateLimit.allowed) {
      await logSecurityEvent("RATE_LIMIT_EXCEEDED", `Voter login attempt from ${ipAddress}`, ipAddress);
      return {
        success: false,
        error: `Too many login attempts. Please try again in ${Math.ceil((rateLimit.resetTime - Date.now()) / 60000)} minutes.`,
      };
    }

    if (!memberCode || !password) {
      return { success: false, error: "Voter code and password are required" };
    }

    // CRITICAL: Use centralized normalization
    const sanitizedCode = normalizeCode(memberCode);

    // Find member
    const member = await db.member.findUnique({
      where: { memberCode: sanitizedCode },
      include: {
        organisation: true,
      },
    });

    if (!member) {
      await logSecurityEvent("VOTER_LOGIN_FAILED", `No member found for code: ${sanitizedCode}`, ipAddress);
      return { success: false, error: "Invalid voter code or password" };
    }

    // Check if password is set
    if (!member.passwordHash) {
      return { success: false, error: "Password not set. Please create your account first." };
    }

    // Verify password
    const isValid = await bcrypt.compare(password, member.passwordHash);

    if (!isValid) {
      await logSecurityEvent("VOTER_LOGIN_FAILED", `Failed password attempt for member: ${member.id}`, ipAddress, member.id);
      return { success: false, error: "Invalid voter code or password" };
    }

    // Check organization status
    if (member.organisation.status !== "APPROVED") {
      return { success: false, error: "Your organization is not yet approved" };
    }

    // Check if account is active
    if (!member.isActive) {
      return { success: false, error: "Your account has been deactivated. Please contact your administrator." };
    }

    // Generate session token
    const sessionToken = generateSessionToken();

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(VOTER_SESSION_COOKIE, `${member.id}:${sessionToken}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION / 1000,
    });

    await logSecurityEvent("VOTER_LOGIN_SUCCESS", `Voter logged in: ${member.memberCode}`, ipAddress, member.id);

    return { success: true };
  } catch (error) {
    console.error("Voter login error:", error);
    return { success: false, error: "An error occurred during login" };
  }
}

// Step 2b: Create voter account (if no account exists)
export async function createVoterAccount(
  memberCode: string,
  fullName: string,
  email: string | null,
  password: string,
  confirmPassword: string
): Promise<{ success: boolean; error?: string; memberId?: string }> {
  try {
    const ipAddress = await getClientIp();

    // Rate limiting
    const rateLimit = await checkRateLimit(`${ipAddress}:account_creation`, "registration");
    if (!rateLimit.allowed) {
      await logSecurityEvent("RATE_LIMIT_EXCEEDED", `Voter account creation attempt from ${ipAddress}`, ipAddress);
      return {
        success: false,
        error: `Too many attempts. Please try again later.`,
      };
    }

    // Validate inputs
    if (!memberCode || !fullName || !password || !confirmPassword) {
      return { success: false, error: "All fields are required" };
    }

    // Password confirmation check
    if (password !== confirmPassword) {
      return { success: false, error: "Passwords do not match" };
    }

    const nameValidation = validateAndSanitizeInput(fullName, {
      type: "name",
      required: true,
    });
    if (!nameValidation.valid) {
      return { success: false, error: nameValidation.error || "Invalid name" };
    }

    let sanitizedEmail: string | null = null;
    if (email && email.trim()) {
      const emailValidation = validateAndSanitizeInput(email, {
        type: "email",
        required: false,
      });
      if (!emailValidation.valid) {
        return { success: false, error: emailValidation.error || "Invalid email format" };
      }
      sanitizedEmail = emailValidation.sanitized || null;
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.errors?.[0] || "Password does not meet requirements" };
    }

    // CRITICAL: Use centralized normalization
    const sanitizedCode = normalizeCode(memberCode);

    // Use a transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // Check if member already exists (inside transaction for consistency)
      const existingMember = await tx.member.findUnique({
        where: { memberCode: sanitizedCode },
      });

      if (existingMember) {
        throw new Error("ACCOUNT_EXISTS");
      }

      // Verify code is valid and UNUSED
      const voterCode = await tx.voterCode.findFirst({
        where: {
          code: sanitizedCode,
          status: "UNUSED",
        },
        include: {
          election: true,
          organisation: true,
        },
      });

      if (!voterCode) {
        throw new Error("INVALID_CODE");
      }

      // Check organization status
      if (voterCode.organisation.status !== "APPROVED") {
        throw new Error("ORG_NOT_APPROVED");
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create member account - link to the specific election this code belongs to
      const member = await tx.member.create({
        data: {
          orgId: voterCode.orgId,
          electionId: voterCode.electionId,
          memberCode: sanitizedCode, // Store normalized code
          fullName: nameValidation.sanitized!,
          email: sanitizedEmail,
          passwordHash,
          role: "VOTER",
          isActive: true,
        },
      });

      // Mark voter code as used
      await tx.voterCode.update({
        where: { id: voterCode.id },
        data: {
          status: "USED",
          usedAt: new Date(),
          usedByIp: ipAddress,
        },
      });

      return member;
    });

    await logSecurityEvent("VOTER_ACCOUNT_CREATED", `Voter account created for code: ${sanitizedCode}`, ipAddress, result.id);

    // Auto-login after account creation
    const sessionToken = generateSessionToken();
    const cookieStore = await cookies();
    cookieStore.set(VOTER_SESSION_COOKIE, `${result.id}:${sessionToken}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION / 1000,
    });

    return { success: true, memberId: result.id };
  } catch (error: unknown) {
    console.error("Create voter account error:", error);
    
    if (error instanceof Error) {
      if (error.message === "ACCOUNT_EXISTS") {
        return { success: false, error: "Account already exists for this code. Please login instead." };
      }
      if (error.message === "INVALID_CODE") {
        return { success: false, error: "Invalid or already used voter code" };
      }
      if (error.message === "ORG_NOT_APPROVED") {
        return { success: false, error: "Your organization is not yet approved" };
      }
    }
    
    // Handle Prisma unique constraint error
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return { success: false, error: "Account already exists for this code" };
    }
    
    return { success: false, error: "Failed to create account. Please try again." };
  }
}

// Legacy function for backwards compatibility - now delegates to proper functions
export async function loginVoter(
  memberCode: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  // Simply delegate to loginWithPassword
  return loginWithPassword(memberCode, password);
}

// Get current voter session
export async function getVoterSession(): Promise<VoterSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(VOTER_SESSION_COOKIE);

    if (!sessionCookie?.value) {
      return null;
    }

    const [memberId] = sessionCookie.value.split(":");

    if (!memberId) {
      return null;
    }

    const member = await db.member.findUnique({
      where: { id: memberId },
      include: {
        organisation: true,
        election: true,
      },
    });

    if (!member || member.role !== "VOTER") {
      return null;
    }

    // Check if organisation is approved
    if (member.organisation.status !== "APPROVED") {
      return null;
    }

    // Check if account is active
    if (!member.isActive) {
      return null;
    }

    return {
      memberId: member.id,
      orgId: member.orgId,
      electionId: member.electionId,
      email: member.email,
      fullName: member.fullName,
      memberCode: member.memberCode,
      orgName: member.organisation.name,
      isActive: member.isActive,
      createdAt: member.createdAt,
    };
  } catch {
    return null;
  }
}

// Check if voter has any active elections (for showing account status)
export async function getVoterAccountStatus(): Promise<{
  hasActiveElections: boolean;
  activeElectionsCount: number;
  canApplyCount: number;
  hasVotedCount: number;
}> {
  const session = await getVoterSession();
  if (!session) {
    return { hasActiveElections: false, activeElectionsCount: 0, canApplyCount: 0, hasVotedCount: 0 };
  }

  try {
    const now = new Date();
    // Use centralized normalization
    const normalizedMemberCode = normalizeCode(session.memberCode);
    
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
    
    if (accessibleElectionIds.size === 0) {
      return { hasActiveElections: false, activeElectionsCount: 0, canApplyCount: 0, hasVotedCount: 0 };
    }

    // Count active elections for voting that member has access to
    const activeElections = await db.election.count({
      where: {
        id: { in: Array.from(accessibleElectionIds) },
        orgId: session.orgId,
        status: "ACTIVE",
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    // Count elections open for applications that member has access to
    const canApplyElections = await db.election.count({
      where: {
        id: { in: Array.from(accessibleElectionIds) },
        orgId: session.orgId,
        candidateMethod: "APPLICATION",
        status: { in: ["DRAFT", "ACTIVE"] },
        OR: [
          { applicationStartDate: { lte: now }, applicationEndDate: { gte: now } },
          { applicationStartDate: null, applicationEndDate: { gte: now } },
          { applicationStartDate: { lte: now }, applicationEndDate: null },
        ],
      },
    });

    // Count elections where voter has voted
    const votedCount = await db.ballot.count({
      where: { voterId: session.memberId },
    });

    return {
      hasActiveElections: activeElections > 0 || canApplyElections > 0,
      activeElectionsCount: activeElections,
      canApplyCount: canApplyElections,
      hasVotedCount: votedCount,
    };
  } catch {
    return { hasActiveElections: false, activeElectionsCount: 0, canApplyCount: 0, hasVotedCount: 0 };
  }
}

// Logout voter
export async function logoutVoter(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(VOTER_SESSION_COOKIE);
  } catch (error) {
    console.error("Voter logout error:", error);
  }
}

// Require voter authentication
export async function requireVoter(): Promise<VoterSession> {
  const session = await getVoterSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }
  
  return session;
}
