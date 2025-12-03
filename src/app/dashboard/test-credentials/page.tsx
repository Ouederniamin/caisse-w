import { DashboardHeader } from "@/components/dashboard-header";
import { CredentialsClient } from "./credentials-client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function TestCredentialsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Identifiants Test" },
        ]}
      />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <CredentialsClient user={session.user} />
      </div>
    </>
  );
}
