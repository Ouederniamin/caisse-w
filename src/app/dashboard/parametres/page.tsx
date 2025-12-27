import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ParametresClient } from "./parametres-client";

export default async function ParametresPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const userRole = (session.user as any).role || "AGENT_CONTROLE";
  const isAdmin = userRole === "ADMIN";
  const isDirection = userRole === "DIRECTION";

  // Only ADMIN and DIRECTION can access this page
  if (!isAdmin && !isDirection) {
    redirect("/dashboard");
  }

  return (
    <ParametresClient
      isAdmin={isAdmin}
      userRole={userRole}
    />
  );
}
