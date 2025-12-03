import { DashboardHeader } from "@/components/dashboard-header";
import { UsersClient } from "./users-client";
import prisma from "@/lib/prisma";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Utilisateurs" },
        ]}
      />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <UsersClient users={users} />
      </div>
    </>
  );
}
