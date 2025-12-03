import prisma from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToursClient } from "./tours-client";

export default async function ToursPage() {
  const tours = await prisma.tour.findMany({
    include: {
      driver: true,
      secteur: true,
      agentControle: true,
      conflicts: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Tours" }
        ]}
      />
      
      <ScrollArea className="flex-1">
        <div className="space-y-6 p-4 md:p-6">
          <ToursClient tours={tours} />
        </div>
      </ScrollArea>
    </div>
  );
}
