import { DashboardHeader } from "@/components/dashboard-header";
import { ChauffeursClient } from "./chauffeurs-client";
import prisma from "@/lib/prisma";

export default async function ChauffeursPage() {
  try {
    const drivers = await prisma.driver.findMany({
      select: {
        id: true,
        nom_complet: true,
        matricule_par_defaut: true,
        tolerance_caisses_mensuelle: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tours: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return (
      <>
        <DashboardHeader breadcrumbs={[{ label: "Chauffeurs" }]} />
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <ChauffeursClient drivers={drivers} />
        </div>
      </>
    );
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return (
      <>
        <DashboardHeader breadcrumbs={[{ label: "Chauffeurs" }]} />
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              Erreur lors du chargement des chauffeurs
            </p>
          </div>
        </div>
      </>
    );
  }
}
