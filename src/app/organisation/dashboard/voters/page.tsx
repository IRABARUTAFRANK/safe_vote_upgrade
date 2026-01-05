import { redirect } from "next/navigation";
import { getOrgAdminSession } from "@/lib/orgAuth";
import { db } from "@/lib/db";
import VotersClient from "./VotersClient";

async function getVotersData(orgId: string) {
  const [members, voterCodes, elections] = await Promise.all([
    db.member.findMany({
      where: { orgId, role: "VOTER" },
      include: {
        _count: {
          select: { ballots: true },
        },
      },
      orderBy: { fullName: "asc" },
    }),
    db.voterCode.findMany({
      where: { orgId },
      include: {
        election: {
          select: { id: true, title: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.election.findMany({
      where: { orgId },
      select: { id: true, title: true, status: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const stats = {
    totalMembers: members.length,
    totalVoterCodes: voterCodes.length,
    unusedCodes: voterCodes.filter((c) => c.status === "UNUSED").length,
    usedCodes: voterCodes.filter((c) => c.status === "USED").length,
  };

  return { members, voterCodes, elections, stats };
}

export default async function VotersPage() {
  const session = await getOrgAdminSession();

  if (!session) {
    redirect("/organisation/login");
  }

  if (session.orgStatus !== "APPROVED") {
    redirect("/organisation/pending");
  }

  const data = await getVotersData(session.orgId);

  return <VotersClient session={session} data={data} />;
}
