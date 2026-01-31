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

// Step 1: Validate member code and check if account exists
export async function validateMemberCode(
  memberCode: string
): Promise<{ 
  success: boolean; 
  error?: string; 
  memberCode?: string;
  orgId?: string;
  hasAccount?: boolean;
  memberId?: string;
  fullName?: string;
  email?: string | null;
}> {
  try {
    const ipAddress = await getClientIp();
    
    // Rate limiting
    const rateLimit = await checkRateLimit(`${ipAddress}:code_validation`, "login");
    if (!rateLimit.allowed) {
      await logSecurityEvent("RATE_LIMIT_EXCEEDED", `Member code validation attempt from ${ipAddress}`, ipAddress);
      return {
        success: false,
        error: `Too many attempts. Please try again in ${Math.ceil((rateLimit.resetTime - Date.now()) / 60000)} minutes.`,
      };
    }

    // Validate and sanitize member code
    const codeValidation = validateAndSanitizeInput(memberCode, {
      type: "text",
      maxLength: 10,
      required: true,
    });
    if (!codeValidation.valid) {
      return { success: false, error: "Invalid member code format" };
    }

    // Remove spaces and convert to uppercase
    const sanitizedCode = memberCode.replace(/\s+/g, '').toUpperCase().trim();

    // FIRST: Check if member account already exists (regardless of VoterCode status)
    // This allows existing members to login even if their VoterCode is USED
    const member = await db.member.findUnique({
      where: { memberCode: sanitizedCode },
      include: {
        organisation: true,
      },
    });

    if (member) {
      // Member exists - allow login
      return {
        success: true,
        memberCode: sanitizedCode,
        orgId: member.orgId,
        hasAccount: true,
        memberId: member.id,
        fullName: member.fullName,
        email: member.email,
      };
    }

    // SECOND: Check if code exists as VoterCode (for new account creation)
    // Check both UNUSED and USED statuses to be more flexible
    const voterCode = await db.voterCode.findFirst({
      where: {
        code: sanitizedCode,
        status: { in: ["UNUSED", "USED"] }, // Allow both unused and used codes
      },
      include: {
        election: {
          include: {
            organisation: true,
          },
        },
      },
    });

    if (voterCode) {
      // Code is valid (from election) but no member account exists - allow account creation
      return {
        success: true,
        memberCode: sanitizedCode,
        orgId: voterCode.orgId,
        hasAccount: false,
        fullName: "", // Will be set during account creation
        email: null,
      };
    }

    // Code not found
    await logSecurityEvent("INVALID_MEMBER_CODE", `Invalid member code attempt: ${sanitizedCode}`, ipAddress);
    return { success: false, error: "Invalid member code. Please check and try again." };
  } catch (error) {
    console.error("Validate member code error:", error);
    return { success: false, error: "An error occurred while validating your code" };
  }
}

// Step 2: Create voter account (if no account exists)
export async function createVoterAccount(
  memberCode: string,
  fullName: string,
  email: string | null,
  password: string
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
    const codeValidation = validateAndSanitizeInput(memberCode, {
      type: "text",
      maxLength: 10,
      required: true,
    });
    if (!codeValidation.valid) {
      return { success: false, error: "Invalid member code" };
    }

    const nameValidation = validateAndSanitizeInput(fullName, {
      type: "name",
      required: true,
    });
    if (!nameValidation.valid) {
      return { success: false, error: nameValidation.error || "Invalid name" };
    }

    let emailValidation: { valid: boolean; sanitized?: string; error?: string } = { valid: true };
    if (email) {
      emailValidation = validateAndSanitizeInput(email, {
        type: "email",
        required: false,
      });
      if (!emailValidation.valid) {
        return { success: false, error: emailValidation.error || "Invalid email format" };
      }
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.errors?.[0] || "Password does not meet requirements" };
    }

    // Normalize code same as login/validate: remove spaces, uppercase (must match VoterCode format)
    const normalizedCode = (codeValidation.sanitized ?? memberCode).replace(/\s+/g, "").toUpperCase().trim();

    // Verify code is valid and unused
    const voterCode = await db.voterCode.findFirst({
      where: {
        code: normalizedCode,
        status: "UNUSED",
      },
      include: {
        election: true,
        organisation: true,
      },
    });

    if (!voterCode) {
      return { success: false, error: "Invalid or already used member code" };
    }

    // Check if member already exists (use same normalized code)
    const existingMember = await db.member.findUnique({
      where: { memberCode: normalizedCode },
    });

    if (existingMember) {
      return { success: false, error: "Account already exists for this code. Please login instead." };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create member account - link to the specific election this code belongs to (store normalized code)
    const member = await db.member.create({
      data: {
        orgId: voterCode.orgId,
        electionId: voterCode.electionId, // Link member to the specific election
        memberCode: normalizedCode,
        fullName: nameValidation.sanitized!,
        email: emailValidation.sanitized || null,
        passwordHash,
        role: "VOTER",
        isActive: true,
      },
    });

    // Mark voter code as used (but don't link to ballot yet - that happens when voting)
    await db.voterCode.update({
      where: { id: voterCode.id },
      data: {
        status: "USED",
        usedAt: new Date(),
        usedByIp: ipAddress,
      },
    });

    await logSecurityEvent("VOTER_ACCOUNT_CREATED", `Voter account created for code: ${normalizedCode}`, ipAddress, member.id);

    return { success: true, memberId: member.id };
  } catch (error: any) {
    console.error("Create voter account error:", error);
    if (error?.code === 'P2002') {
      return { success: false, error: "Account already exists for this code" };
    }
    return { success: false, error: "Failed to create account. Please try again." };
  }
}

// Step 3: Login with member code or email and password
export async function loginVoter(
  identifier: string,
  password: string
): Promise<{ success: boolean; error?: string; needsRegistration?: boolean }> {
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

    const trimmed = (identifier || "").trim();
    if (!trimmed) {
      return { success: false, error: "Please enter your email or voter ID" };
    }

    // Find member by email OR by member code (voter ID)
    let member = null;
    if (trimmed.includes("@")) {
      // Login by email
      const emailValidation = validateAndSanitizeInput(trimmed, {
        type: "email",
        required: true,
      });
      if (!emailValidation.valid) {
        return { success: false, error: "Invalid email format" };
      }
      member = await db.member.findFirst({
        where: { email: emailValidation.sanitized!.toLowerCase() },
        include: { organisation: true },
      });
    } else {
      // Login by member code (voter ID)
      const codeValidation = validateAndSanitizeInput(trimmed, {
        type: "text",
        maxLength: 50,
        required: true,
      });
      if (!codeValidation.valid) {
        return { success: false, error: "Invalid voter ID format" };
      }
      const sanitizedCode = codeValidation.sanitized!.replace(/\s+/g, "").toUpperCase().trim();
      member = await db.member.findUnique({
        where: { memberCode: sanitizedCode },
        include: { organisation: true },
      });
    }

    if (!member) {
      // If they used a voter code (no @), check if code is valid but no account yet → tell them to register
      if (!trimmed.includes("@")) {
        const normalizedCode = trimmed.replace(/\s+/g, "").toUpperCase().trim();
        const validCode = await db.voterCode.findFirst({
          where: {
            code: normalizedCode,
            status: { in: ["UNUSED", "USED"] },
          },
        });
        if (validCode) {
          return {
            success: false,
            error: "No account found for this voter code. Please create your account first using the form below.",
            needsRegistration: true,
          };
        }
      }
      await logSecurityEvent("VOTER_LOGIN_FAILED", `Invalid login attempt: ${trimmed.includes("@") ? "email" : "voter ID"}`, ipAddress);
      return { success: false, error: "Invalid email/voter ID or password" };
    }

    if (!member.passwordHash) {
      return { success: false, error: "Password not set. Please create your account first." };
    }

    // Verify password
    const isValid = await bcrypt.compare(password, member.passwordHash);

    if (!isValid) {
      await logSecurityEvent("VOTER_LOGIN_FAILED", `Failed password attempt for member: ${member.id}`, ipAddress, member.id);
      return { success: false, error: "Invalid member code or password" };
    }

    // Check organization status
    if (member.organisation.status === "REJECTED") {
      return { success: false, error: "Your organization has been rejected" };
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
          { applicationStartDate: null, applicationEndDate: null },
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

