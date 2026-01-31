"use server";

import { validateMemberCode, createVoterAccount, loginWithPassword } from "@/lib/voterAuth";

// Step 1: Validate the voter code
export async function validateCode(formData: FormData) {
  const memberCode = (formData.get("memberCode") as string) || "";
  const result = await validateMemberCode(memberCode);
  return result;
}

// Step 2a: Login with existing account
export async function login(formData: FormData) {
  const memberCode = (formData.get("memberCode") as string) || "";
  const password = (formData.get("password") as string) || "";
  const result = await loginWithPassword(memberCode, password);
  return result;
}

// Step 2b: Create new account
export async function createAccount(formData: FormData) {
  const memberCode = (formData.get("memberCode") as string) || "";
  const fullName = (formData.get("fullName") as string) || "";
  const email = (formData.get("email") as string) || "";
  const password = (formData.get("password") as string) || "";
  const confirmPassword = (formData.get("confirmPassword") as string) || "";

  const result = await createVoterAccount(
    memberCode,
    fullName,
    email || null,
    password,
    confirmPassword
  );
  return result;
}
