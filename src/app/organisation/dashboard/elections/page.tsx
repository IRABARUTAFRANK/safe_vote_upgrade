import { redirect } from "next/navigation";
import { getOrgAdminSession } from "@/lib/orgAuth";
import { db } from "@/lib/db";
import ElectionsListClient from "./ElectionsListClient";

async function getElectionsData(orgId: string) {
  const elections = await db.election.findMany({
    where: { orgId },
    include: {
      _count: {
        select: {
          positions: true,
          ballots: true,
          voterCodes: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return elections;
}

export default async function ElectionsPage() {
  const session = await getOrgAdminSession();
  
  if (!session) {
    redirect("/organisation/login");
  }
  
  if (session.orgStatus !== "APPROVED") {
    redirect("/organisation/pending");
  }

  const elections = await getElectionsData(session.orgId);

  return <ElectionsListClient session={session} elections={elections} />;
}
