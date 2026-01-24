/**
 * Security Utilities and Middleware
 * Comprehensive security layer for SafeVote platform
 */

import { headers } from "next/headers";
import { db } from "./db";

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
export const RATE_LIMITS = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  registration: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  api: { maxAttempts: 100, windowMs: 60 * 1000 }, // 100 per minute
  codeGeneration: { maxAttempts: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
};

/**
 * Rate limiting check
 */
export async function checkRateLimit(
  identifier: string,
  limitType: keyof typeof RATE_LIMITS
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const limit = RATE_LIMITS[limitType];
  const key = `${identifier}:${limitType}`;
  const now = Date.now();

  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // Create new record
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + limit.windowMs,
    });
    return {
      allowed: true,
      remaining: limit.maxAttempts - 1,
      resetTime: now + limit.windowMs,
    };
  }

  if (record.count >= limit.maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  // Increment count
  record.count++;
  rateLimitStore.set(key, record);

  return {
    allowed: true,
    remaining: limit.maxAttempts - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Get client IP address
 */
export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  const cfConnectingIp = headersList.get("cf-connecting-ip"); // Cloudflare

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  return "unknown";
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (password.length > 128) {
    errors.push("Password must be less than 128 characters");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize string input (prevent XSS)
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .substring(0, 10000); // Max length
}

/**
 * Sanitize email
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim().substring(0, 254);
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Validate organization code format (SV-XXXX pattern)
 */
export function validateOrgCode(code: string): boolean {
  // Format: SV-XXXX (prefix + 4 alphanumeric chars, first 2 = last 2)
  const codeRegex = /^SV-[A-Z0-9]{4}$/;
  if (!codeRegex.test(code.toUpperCase())) {
    return false;
  }
  // Verify that first 2 chars equal last 2 chars (org identity pattern)
  const parts = code.toUpperCase().split('-');
  if (parts.length === 2 && parts[1].length === 4) {
    const firstTwo = parts[1].substring(0, 2);
    const lastTwo = parts[1].substring(2, 4);
    return firstTwo === lastTwo;
  }
  return false;
}

/**
 * Check for suspicious activity patterns
 */
export async function checkSuspiciousActivity(
  ipAddress: string,
  action: string
): Promise<boolean> {
  // Check for multiple failed logins from same IP
  const recentFailures = await db.superAdminLog.count({
    where: {
      action: "LOGIN_FAILED",
      ipAddress,
      createdAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      },
    },
  });

  // If more than 20 failed attempts in an hour, flag as suspicious
  if (recentFailures > 20) {
    return true;
  }

  return false;
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  type: string,
  details: string,
  ipAddress?: string,
  userId?: string
): Promise<void> {
  try {
    // In production, use a dedicated security log table
    console.warn(`[SECURITY] ${type}: ${details}`, {
      ipAddress,
      userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to log security event:", error);
  }
}

/**
 * Validate input length
 */
export function validateInputLength(
  input: string,
  min: number,
  max: number,
  fieldName: string
): { valid: boolean; error?: string } {
  if (input.length < min) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${min} characters`,
    };
  }
  if (input.length > max) {
    return {
      valid: false,
      error: `${fieldName} must be less than ${max} characters`,
    };
  }
  return { valid: true };
}

/**
 * Check if string contains SQL injection patterns
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|#|\/\*|\*\/)/,
    /(UNION\s+SELECT)/i,
    /(;\s*(DROP|DELETE|UPDATE|INSERT))/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Check if string contains XSS patterns
 */
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<img[^>]+src[^>]*=.*javascript:/i,
    /<svg[^>]*onload/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Comprehensive input validation
 */
export function validateAndSanitizeInput(
  input: string,
  options: {
    type: "text" | "email" | "name" | "code";
    maxLength?: number;
    required?: boolean;
  }
): { valid: boolean; sanitized?: string; error?: string } {
  if (options.required && !input) {
    return { valid: false, error: "This field is required" };
  }

  if (!input && !options.required) {
    return { valid: true, sanitized: "" };
  }

  // Check for SQL injection
  if (detectSQLInjection(input)) {
    return { valid: false, error: "Invalid characters detected" };
  }

  // Check for XSS
  if (detectXSS(input)) {
    return { valid: false, error: "Invalid characters detected" };
  }

  let sanitized = sanitizeInput(input);

  // Type-specific validation
  switch (options.type) {
    case "email":
      if (!validateEmail(sanitized)) {
        return { valid: false, error: "Invalid email format" };
      }
      sanitized = sanitizeEmail(sanitized);
      break;

    case "name":
      if (sanitized.length < 2) {
        return { valid: false, error: "Name must be at least 2 characters" };
      }
      if (sanitized.length > 100) {
        return { valid: false, error: "Name must be less than 100 characters" };
      }
      break;

    case "code":
      if (!validateOrgCode(sanitized)) {
        return { valid: false, error: "Invalid code format" };
      }
      break;

    case "text":
      if (options.maxLength && sanitized.length > options.maxLength) {
        return {
          valid: false,
          error: `Text must be less than ${options.maxLength} characters`,
        };
      }
      break;
  }

  return { valid: true, sanitized };
}

