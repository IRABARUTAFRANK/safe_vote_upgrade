import { redirect } from "next/navigation";
import { getSuperAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardClient from "./DashboardClient";

async function getDashboardData() {
  const [
    totalOrganisations,
    pendingOrganisations,
    approvedOrganisations,
    totalMembers,
    totalElections,
    recentOrganisations,
    recentLogs,
  ] = await Promise.all([
    db.organisation.count(),
    db.organisation.count({ where: { status: "PENDING" } }),
    db.organisation.count({ where: { status: "APPROVED" } }),
    db.member.count(),
    db.election.count(),
    db.organisation.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        type: true,
        status: true,
        createdAt: true,
        _count: { select: { members: true, elections: true } },
      },
    }),
    db.superAdminLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        admin: { select: { fullName: true, email: true } },
      },
    }),
  ]);

  return {
    stats: {
      totalOrganisations,
      pendingOrganisations,
      approvedOrganisations,
      totalMembers,
      totalElections,
    },
    recentOrganisations,
    recentLogs,
  };
}

export default async function SuperAdminDashboardPage() {
  const session = await getSuperAdminSession();

  if (!session) {
    redirect("/superadmin/login");
  }

  const data = await getDashboardData();

  return <DashboardClient session={session} data={data} />;
}
