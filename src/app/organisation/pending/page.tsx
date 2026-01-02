import { redirect } from "next/navigation";
import { getOrgAdminSession } from "@/lib/orgAuth";
import { db } from "@/lib/db";
import PendingClient from "./PendingClient";

export default async function PendingPage() {
  // Try to get session to check if user is logged in
  const session = await getOrgAdminSession();
  
  // If logged in, get organization status
  let organisation = null;
  if (session) {
    organisation = await db.organisation.findUnique({
      where: { id: session.orgId },
      select: {
        id: true,
        name: true,
        status: true,
        orgCode: true,
      },
    });
  }

  return <PendingClient session={session} organisation={organisation} />;
}

