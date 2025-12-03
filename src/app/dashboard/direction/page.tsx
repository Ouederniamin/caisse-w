import { DashboardHeader } from "@/components/dashboard-header";
import { DirectionClient } from "./direction-client";
import prisma from "@/lib/prisma";

export default async function DirectionDashboardPage() {
  try {
    // Fetch tours with minimal includes
    const tours = await prisma.tour.findMany({
      select: {
        id: true,
        statut: true,
        createdAt: true,
        driver: {
          select: {
            id: true,
            nom_complet: true,
          },
        },
        secteur: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Fetch conflicts separately
    const conflicts = await prisma.conflict.findMany({
      select: {
        id: true,
        statut: true,
        quantite_perdue: true,
        montant_dette_tnd: true,
        notes_direction: true,
        createdAt: true,
        tour: {
          select: {
            id: true,
            driver: {
              select: {
                id: true,
                nom_complet: true,
              },
            },
            secteur: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get driver and secteur counts
    const [driverCount, secteurCount] = await Promise.all([
      prisma.driver.count(),
      prisma.secteur.count(),
    ]);

    return (
      <>
        <DashboardHeader
          breadcrumbs={[{ label: "Dashboard Direction" }]}
        />
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <DirectionClient
            tours={tours}
            conflicts={conflicts}
            driverCount={driverCount}
            secteurCount={secteurCount}
          />
        </div>
      </>
    );
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return (
      <>
        <DashboardHeader
          breadcrumbs={[{ label: "Dashboard Direction" }]}
        />
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Erreur lors du chargement des données</p>
          </div>
        </div>
      </>
    );
  }
}
