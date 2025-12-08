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

  // Redirect based on role (case-insensitive check)
  const role = session.user.role?.toUpperCase();
  
  if (role === "ADMIN") {
    redirect("/dashboard/admin");
  } else if (role === "DIRECTION") {
    redirect("/dashboard/direction");
  }

  // For other users, redirect to direction page
  redirect("/dashboard/direction");
}
