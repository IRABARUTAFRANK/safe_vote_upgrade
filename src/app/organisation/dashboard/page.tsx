import { redirect } from "next/navigation";
import { getOrgAdminSession } from "@/lib/orgAuth";
import { db } from "@/lib/db";
import DashboardClient from "./DashboardClient";

async function getDashboardData(orgId: string) {
<<<<<<< HEAD
  const [organisation, stats, elections, allElections] = await Promise.all([
=======
  const [organisation, stats] = await Promise.all([
>>>>>>> 6c7180de8b91f8b1e67e5630306b7f3e7c27ebf7
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
<<<<<<< HEAD
      draftElections: await db.election.count({
        where: {
          orgId,
          status: "DRAFT",
        },
      }),
      closedElections: await db.election.count({
        where: {
          orgId,
          status: "CLOSED",
        },
      }),
      totalVotes: await db.ballot.count({
        where: {
          election: {
            orgId,
          },
        },
      }),
    },
    db.election.findMany({
      where: { orgId },
      orderBy: { startDate: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        startDate: true,
        endDate: true,
        _count: {
          select: {
            positions: true,
            ballots: true,
          },
        },
      },
    }),
    db.election.findMany({
      where: { orgId },
      select: {
        id: true,
        title: true,
        status: true,
        startDate: true,
        endDate: true,
        _count: {
          select: {
            ballots: true,
            positions: true,
          },
        },
      },
    }),
  ]);

  // Get voting activity data (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentBallots = await db.ballot.findMany({
    where: {
      election: {
        orgId,
      },
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Group ballots by date for chart
  const votesByDate = recentBallots.reduce((acc, ballot) => {
    const date = new Date(ballot.createdAt).toISOString().split("T")[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const votesTimeline = Object.entries(votesByDate)
    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      votes: count,
    }));

  return { 
    organisation, 
    stats, 
    elections,
    chartData: {
      electionStatusDistribution: [
        { name: "Draft", value: stats.draftElections, color: "#64748b" },
        { name: "Active", value: stats.activeElections, color: "#10b981" },
        { name: "Closed", value: stats.closedElections, color: "#3b82f6" },
      ],
      votesTimeline,
      electionPerformance: allElections.map((election) => ({
        name: election.title.length > 20 ? election.title.substring(0, 20) + "..." : election.title,
        votes: election._count.ballots,
        positions: election._count.positions,
        status: election.status,
      })),
    },
  };
=======
    },
  ]);

  return { organisation, stats };
>>>>>>> 6c7180de8b91f8b1e67e5630306b7f3e7c27ebf7
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

<<<<<<< HEAD
  return <DashboardClient session={session} data={data} elections={data.elections} />;
=======
  return <DashboardClient session={session} data={data} />;
>>>>>>> 6c7180de8b91f8b1e67e5630306b7f3e7c27ebf7
}

