import { redirect } from "next/navigation";
import { getVoterSession } from "@/lib/voterAuth";
import VoterDashboardClient from "./VoterDashboardClient";

export default async function VoterDashboardPage() {
  const session = await getVoterSession();
  
  if (!session) {
    redirect("/vote/login");
  }

  return (
    <VoterDashboardClient 
      session={{
        memberId: session.memberId,
        orgId: session.orgId,
        electionId: session.electionId,
        fullName: session.fullName,
        memberCode: session.memberCode,
        orgName: session.orgName,
      }} 
    />
  );
}
