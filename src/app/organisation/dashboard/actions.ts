"use server";

import { logoutOrgAdmin } from "@/lib/orgAuth";

export async function logoutOrgAdminAction() {
  await logoutOrgAdmin();
  return { success: true };
}

