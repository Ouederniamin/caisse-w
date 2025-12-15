import prisma from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConflitsClient } from "./conflits-client";

export default async function ConflitsPage() {
  const conflicts = await prisma.conflict.findMany({
    include: {
      tour: {
        include: {
          driver: true,
          secteur: true,
          agentControle: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Conflits" }
        ]}
      />
      
      <ScrollArea className="flex-1">
        <div className="space-y-6 p-4 md:p-6">
          <ConflitsClient conflicts={conflicts} />
        </div>
      </ScrollArea>
    </div>
  );
}
