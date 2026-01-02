import { redirect } from "next/navigation";
import { getOrgAdminSession } from "@/lib/orgAuth";
import { getElectionDetails } from "../actions";
import ElectionDetailClient from "./ElectionDetailClient";

export default async function ElectionDetailPage({ params }: { params: { id: string } }) {
  const session = await getOrgAdminSession();
  
  if (!session) {
    redirect("/organisation/login");
  }
  
  if (session.orgStatus !== "APPROVED") {
    redirect("/organisation/pending");
  }

  const result = await getElectionDetails(params.id);

  if (!result.success || !result.data) {
    redirect("/organisation/dashboard");
  }

  return <ElectionDetailClient session={session} election={result.data} />;
}

