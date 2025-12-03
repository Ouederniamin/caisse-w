import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Redirect based on role
  if (session.user.role === "admin") {
    redirect("/dashboard/admin");
  } else if (session.user.role === "direction") {
    redirect("/dashboard/direction");
  }

  // For other users, redirect to direction page
  redirect("/dashboard/direction");
}
