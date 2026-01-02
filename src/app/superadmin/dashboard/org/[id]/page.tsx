import { redirect } from "next/navigation";
import { getSuperAdminSession } from "@/lib/auth";
import { getOrganisationDetails } from "../../actions";
import OrganisationDetailClient from "./OrganisationDetailClient";

export default async function OrganisationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSuperAdminSession();
  const { id } = await params;

  if (!session) {
    redirect("/superadmin/login");
  }

  const result = await getOrganisationDetails(id);

  if (!result.success || !result.data) {
    redirect("/superadmin/dashboard");
  }

  return <OrganisationDetailClient session={session} organisation={result.data} />;
}

