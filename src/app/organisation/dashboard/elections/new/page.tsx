import { redirect } from "next/navigation";
import { getOrgAdminSession } from "@/lib/orgAuth";
import NewElectionClient from "./NewElectionClient";

export default async function NewElectionPage() {
  const session = await getOrgAdminSession();
  
  if (!session) {
    redirect("/organisation/login");
  }
  
  if (session.orgStatus !== "APPROVED") {
    redirect("/organisation/pending");
  }

  return <NewElectionClient />;
}

