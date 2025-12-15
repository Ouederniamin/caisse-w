import { DashboardHeader } from "@/components/dashboard-header";
import { DriverDetailClient } from "./driver-detail-client";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function DriverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    // Get current month dates for stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const driver = await prisma.driver.findUnique({
      where: { id },
      select: {
        id: true,
        nom_complet: true,
        matricule_par_defaut: true,
        marque_vehicule: true,
        poids_tare_vehicule: true,
        tolerance_caisses_mensuelle: true,
        createdAt: true,
        updatedAt: true,
        tours: {
          select: {
            id: true,
            statut: true,
            matricule_vehicule: true,
            nbre_caisses_depart: true,
            nbre_caisses_retour: true,
            createdAt: true,
            secteur: {
              select: {
                id: true,
                nom: true,
              },
            },
            conflicts: {
              select: {
                id: true,
                statut: true,
                quantite_perdue: true,
                montant_dette_tnd: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 100,
        },
      },
    });

    if (!driver) {
      notFound();
    }

    // Calculate monthly stats
    const thisMonthTours = driver.tours.filter(t => {
      const tourDate = new Date(t.createdAt);
      return tourDate >= startOfMonth && tourDate <= endOfMonth;
    });

    const thisMonthCaissesDepart = thisMonthTours.reduce((sum, t) => sum + t.nbre_caisses_depart, 0);
    const thisMonthCaissesRetour = thisMonthTours.reduce((sum, t) => sum + (t.nbre_caisses_retour || 0), 0);
    const thisMonthCaissesPerdues = thisMonthCaissesDepart - thisMonthCaissesRetour;

    // Calculate all-time conflict stats
    const allConflicts = driver.tours.flatMap(t => t.conflicts);
    const pendingConflicts = allConflicts.filter(c => c.statut === "EN_ATTENTE");
    const paidConflicts = allConflicts.filter(c => c.statut === "PAYEE");
    const cancelledConflicts = allConflicts.filter(c => c.statut === "ANNULE");

    const totalDebt = pendingConflicts.reduce((sum, c) => sum + c.montant_dette_tnd, 0);
    const paidDebt = paidConflicts.reduce((sum, c) => sum + c.montant_dette_tnd, 0);
    const cancelledDebt = cancelledConflicts.reduce((sum, c) => sum + c.montant_dette_tnd, 0);

    // Calculate total caisses lost
    const totalCaissesPerdues = allConflicts.reduce((sum, c) => sum + c.quantite_perdue, 0);

    // Get unique sectors worked
    const uniqueSectors = new Set(driver.tours.filter(t => t.secteur).map(t => t.secteur!.nom));

    const driverStats = {
      thisMonth: {
        tours: thisMonthTours.length,
        caissesDepart: thisMonthCaissesDepart,
        caissesRetour: thisMonthCaissesRetour,
        caissesPerdues: thisMonthCaissesPerdues,
      },
      allTime: {
        tours: driver.tours.length,
        conflicts: allConflicts.length,
        pendingConflicts: pendingConflicts.length,
        paidConflicts: paidConflicts.length,
        cancelledConflicts: cancelledConflicts.length,
        totalDebt: Math.round(totalDebt * 100) / 100,
        paidDebt: Math.round(paidDebt * 100) / 100,
        cancelledDebt: Math.round(cancelledDebt * 100) / 100,
        totalCaissesPerdues,
        uniqueSectors: Array.from(uniqueSectors),
      },
    };

    return (
      <>
        <DashboardHeader
          breadcrumbs={[
            { label: "Chauffeurs", href: "/dashboard/chauffeurs" },
            { label: driver.nom_complet },
          ]}
        />
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <DriverDetailClient driver={driver} stats={driverStats} />
        </div>
      </>
    );
  } catch (error) {
    console.error("Error fetching driver:", error);
    notFound();
  }
}
