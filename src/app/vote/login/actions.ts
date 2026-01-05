"use server";

import { validateMemberCode, createVoterAccount, loginVoter } from "@/lib/voterAuth";
import {
  checkRateLimit,
  getClientIp,
  validateAndSanitizeInput,
  logSecurityEvent,
} from "@/lib/security";

export async function validateCode(formData: FormData) {
  const memberCode = (formData.get("memberCode") as string) || "";

  const result = await validateMemberCode(memberCode);
  return result;
}

export async function createAccount(formData: FormData) {
  const memberCode = (formData.get("memberCode") as string) || "";
  const fullName = (formData.get("fullName") as string) || "";
  const email = (formData.get("email") as string) || "";
  const password = (formData.get("password") as string) || "";

  const result = await createVoterAccount(
    memberCode,
    fullName,
    email || null,
    password
  );
  return result;
}

export async function login(formData: FormData) {
  const memberCode = (formData.get("memberCode") as string) || "";
  const password = (formData.get("password") as string) || "";

  const result = await loginVoter(memberCode, password);
  return result;
}

