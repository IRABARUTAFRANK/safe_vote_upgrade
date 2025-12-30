import { redirect } from "next/navigation";
import { getOrgAdminSession } from "@/lib/orgAuth";
import { db } from "@/lib/db";
import DashboardClient from "./DashboardClient";

async function getDashboardData(orgId: string) {
  const [organisation, stats] = await Promise.all([
    db.organisation.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        email: true,
        type: true,
        orgCode: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            members: true,
            elections: true,
          },
        },
      },
    }),
    {
      totalMembers: await db.member.count({ where: { orgId } }),
      totalElections: await db.election.count({ where: { orgId } }),
      activeElections: await db.election.count({
        where: {
          orgId,
          status: "ACTIVE",
        },
      }),
    },
  ]);

  return { organisation, stats };
}

export default async function OrgDashboardPage() {
  // Try to get session, but don't require approval yet
  const session = await getOrgAdminSession();
  
  if (!session) {
    redirect("/organisation/login");
  }
  
  // If organization is not approved, redirect to pending page
  if (session.orgStatus !== "APPROVED") {
    redirect("/organisation/pending");
  }

  const data = await getDashboardData(session.orgId);

  return <DashboardClient session={session} data={data} />;
}

