import { redirect } from "next/navigation";
import { getOrgAdminSession } from "@/lib/orgAuth";
import { db } from "@/lib/db";
import ReportsClient from "./ReportsClient";

async function getReportsData(orgId: string) {
  const [elections, members, voterCodes, ballots] = await Promise.all([
    db.election.findMany({
      where: { orgId },
      include: {
        positions: {
          include: {
            candidates: {
              include: {
                _count: { select: { votes: true } },
              },
            },
            _count: { select: { votes: true } },
          },
        },
        _count: {
          select: { ballots: true, voterCodes: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.member.findMany({
      where: { orgId, role: "VOTER" },
      select: { id: true, createdAt: true },
    }),
    db.voterCode.findMany({
      where: { orgId },
      select: { id: true, status: true, createdAt: true, usedAt: true },
    }),
    db.ballot.findMany({
      where: { election: { orgId } },
      select: { id: true, createdAt: true, electionId: true },
    }),
  ]);

  // Calculate overall stats
  const overallStats = {
    totalElections: elections.length,
    activeElections: elections.filter(e => e.status === "ACTIVE").length,
    closedElections: elections.filter(e => e.status === "CLOSED").length,
    draftElections: elections.filter(e => e.status === "DRAFT").length,
    totalVoterCodes: voterCodes.length,
    usedCodes: voterCodes.filter(c => c.status === "USED").length,
    unusedCodes: voterCodes.filter(c => c.status === "UNUSED").length,
    totalBallots: ballots.length,
    totalMembers: members.length,
  };

  // Calculate participation rate
  const participationRate = overallStats.totalVoterCodes > 0
    ? ((overallStats.usedCodes / overallStats.totalVoterCodes) * 100).toFixed(1)
    : "0";

  // Get election summaries with results
  const electionSummaries = elections.map(election => {
    const totalVotes = election._count.ballots;
    const totalVoters = election._count.voterCodes;
    const participationPct = totalVoters > 0 ? ((totalVotes / totalVoters) * 100).toFixed(1) : "0";

    const positionResults = election.positions.map(pos => {
      const candidates = pos.candidates.map(c => ({
        id: c.id,
        name: c.name,
        votes: c._count.votes,
        percentage: pos._count.votes > 0 ? ((c._count.votes / pos._count.votes) * 100).toFixed(1) : "0",
      })).sort((a, b) => b.votes - a.votes);

      return {
        id: pos.id,
        name: pos.name,
        totalVotes: pos._count.votes,
        maxWinners: pos.maxWinners,
        candidates,
        winner: candidates.length > 0 ? candidates[0] : null,
      };
    });

    return {
      id: election.id,
      title: election.title,
      status: election.status,
      startDate: election.startDate,
      endDate: election.endDate,
      totalVotes,
      totalVoters,
      participationRate: participationPct,
      positionResults,
    };
  });

  // Votes over time (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentBallots = ballots.filter(b => new Date(b.createdAt) >= thirtyDaysAgo);
  const votesPerDay: Record<string, number> = {};
  
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    votesPerDay[dateStr] = 0;
  }

  recentBallots.forEach(ballot => {
    const dateStr = new Date(ballot.createdAt).toISOString().split('T')[0];
    if (votesPerDay[dateStr] !== undefined) {
      votesPerDay[dateStr]++;
    }
  });

  const votesTimeline = Object.entries(votesPerDay)
    .map(([date, votes]) => ({ date, votes }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    overallStats,
    participationRate,
    electionSummaries,
    votesTimeline,
  };
}

export default async function ReportsPage() {
  const session = await getOrgAdminSession();

  if (!session) {
    redirect("/organisation/login");
  }

  if (session.orgStatus !== "APPROVED") {
    redirect("/organisation/pending");
  }

  const data = await getReportsData(session.orgId);

  return <ReportsClient session={session} data={data} />;
}
