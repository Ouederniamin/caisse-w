import { DashboardHeader } from "@/components/dashboard-header";
import { TourDetailClient } from "./tour-detail-client";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const tour = await prisma.tour.findUnique({
      where: { id },
      include: {
        driver: true,
        secteur: true,
        agentControle: { select: { id: true, email: true, name: true, role: true } },
        agentHygiene: { select: { id: true, email: true, name: true, role: true } },
        securiteSortie: { select: { id: true, email: true, name: true, role: true } },
        securiteEntree: { select: { id: true, email: true, name: true, role: true } },
        lignesRetour: { include: { produit: true } },
        conflicts: true,
      },
    });

    if (!tour) {
      notFound();
    }

    return (
      <div className="flex flex-col h-full">
        <DashboardHeader
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Tours", href: "/dashboard/tours" },
            { label: `Tournée ${tour.matricule_vehicule}` },
          ]}
        />
        
        <TourDetailClient tour={tour} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching tour:", error);
    notFound();
  }
}
