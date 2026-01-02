import { cookies } from "next/headers";
import { db } from "./db";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "superadmin_session";
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

// Simple session token generation
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Hash session token for storage
async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

export interface SuperAdminSession {
  id: string;
  email: string;
  fullName: string;
}

// Login super admin
export async function loginSuperAdmin(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await db.superAdmin.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!admin) {
      return { success: false, error: "Invalid credentials" };
    }

    // Check if account is locked
    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (admin.lockedUntil.getTime() - Date.now()) / 60000
      );
      return {
        success: false,
        error: `Account locked. Try again in ${minutesLeft} minutes.`,
      };
    }

    // Check if account is active
    if (!admin.isActive) {
      return { success: false, error: "Account is deactivated" };
    }

    // Verify password
    const isValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isValid) {
      // Increment failed attempts
      const failedAttempts = admin.failedAttempts + 1;
      const updateData: any = { failedAttempts };

      // Lock account after 5 failed attempts
      if (failedAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
        updateData.failedAttempts = 0;
      }

      await db.superAdmin.update({
        where: { id: admin.id },
        data: updateData,
      });

      // Log failed attempt
      await db.superAdminLog.create({
        data: {
          adminId: admin.id,
          action: "LOGIN_FAILED",
          ipAddress,
          userAgent,
          details: `Failed attempt ${failedAttempts}`,
        },
      });

      return { success: false, error: "Invalid credentials" };
    }

    // Generate session token
    const sessionToken = generateSessionToken();
    const hashedToken = await hashToken(sessionToken);

    // Update admin with session info
    await db.superAdmin.update({
      where: { id: admin.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    // Log successful login
    await db.superAdminLog.create({
      data: {
        adminId: admin.id,
        action: "LOGIN",
        ipAddress,
        userAgent,
      },
    });

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, `${admin.id}:${sessionToken}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION / 1000,
    });

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "An error occurred during login" };
  }
}

// Get current super admin session
export async function getSuperAdminSession(): Promise<SuperAdminSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);

    if (!sessionCookie?.value) {
      return null;
    }

    const [adminId] = sessionCookie.value.split(":");

    if (!adminId) {
      return null;
    }

    const admin = await db.superAdmin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
      },
    });

    if (!admin || !admin.isActive) {
      return null;
    }

    return {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
    };
  } catch {
    return null;
  }
}

// Logout super admin
export async function logoutSuperAdmin(): Promise<void> {
  try {
    const session = await getSuperAdminSession();
    
    if (session) {
      // Log logout action
      await db.superAdminLog.create({
        data: {
          adminId: session.id,
          action: "LOGOUT",
        },
      });
    }

    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
  } catch (error) {
    console.error("Logout error:", error);
  }
}

// Require super admin authentication (for use in server components/actions)
export async function requireSuperAdmin(): Promise<SuperAdminSession> {
  const session = await getSuperAdminSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }
  
  return session;
}

// Log super admin action
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: string,
  ipAddress?: string
): Promise<void> {
  await db.superAdminLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId,
      details,
      ipAddress,
    },
  });
}
