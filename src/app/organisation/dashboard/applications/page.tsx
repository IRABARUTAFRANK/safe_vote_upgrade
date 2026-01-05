import { redirect } from "next/navigation";
import { getOrgAdminSession } from "@/lib/orgAuth";
import { db } from "@/lib/db";
import ApplicationsClient from "./ApplicationsClient";

async function getApplicationsData(orgId: string, electionId?: string) {
  const elections = await db.election.findMany({
    where: { 
      orgId,
      candidateMethod: "APPLICATION",
    },
    select: {
      id: true,
      title: true,
      status: true,
      _count: {
        select: { applications: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const applications = await db.candidateApplication.findMany({
    where: {
      election: { orgId },
      ...(electionId ? { electionId } : {}),
    },
    include: {
      election: {
        select: { id: true, title: true },
      },
      position: {
        select: { id: true, name: true },
      },
      applicant: {
        select: { id: true, fullName: true, email: true, memberCode: true },
      },
      responses: {
        include: {
          field: true,
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return { elections, applications };
}

export default async function ApplicationsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ electionId?: string }> 
}) {
  const session = await getOrgAdminSession();
  
  if (!session) {
    redirect("/organisation/login");
  }
  
  if (session.orgStatus !== "APPROVED") {
    redirect("/organisation/pending");
  }

  const params = await searchParams;
  const data = await getApplicationsData(session.orgId, params.electionId);

  return <ApplicationsClient session={session} data={data} selectedElectionId={params.electionId} />;
}
