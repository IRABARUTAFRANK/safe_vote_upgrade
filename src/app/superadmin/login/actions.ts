"use server";

import { loginSuperAdmin } from "@/lib/auth";
import { headers } from "next/headers";

export async function superAdminLoginAction(formData: FormData) {
  const email = (formData.get("email") as string) || "";
  const password = (formData.get("password") as string) || "";

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  // Get client info for logging
  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
  const userAgent = headersList.get("user-agent") || "unknown";

  const result = await loginSuperAdmin(email, password, ipAddress, userAgent);

  return result;
}
