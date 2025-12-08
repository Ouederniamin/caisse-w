import { DashboardHeader } from "@/components/dashboard-header";
import prisma from "@/lib/prisma";
import { FinanceClient } from "./finance-client";

export default async function FinancePage() {
  try {
    // Get current month dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Fetch tours for the current month
    const tours = await prisma.tour.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        id: true,
        nbre_caisses_depart: true,
        nbre_caisses_retour: true,
        poids_net_produits_depart: true,
        poids_net_total_calcule: true,
        statut: true,
        createdAt: true,
      },
    });

    // Calculate summary
    let caissesLivrees = 0;
    let caissesRetournees = 0;
    let kilosDepart = 0;
    let kilosRetour = 0;

    tours.forEach((tour) => {
      caissesLivrees += tour.nbre_caisses_depart;
      caissesRetournees += tour.nbre_caisses_retour || 0;
      kilosDepart += tour.poids_net_produits_depart;
      kilosRetour += tour.poids_net_total_calcule || 0;
    });

    const caissesPerdues = caissesLivrees - caissesRetournees;
    const tauxPerte = caissesLivrees > 0 ? Math.round((caissesPerdues / caissesLivrees) * 10000) / 100 : 0;

    // Fetch conflicts for the current month
    const conflicts = await prisma.conflict.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        id: true,
        statut: true,
        quantite_perdue: true,
        montant_dette_tnd: true,
        createdAt: true,
        tour: {
          select: {
            driver: {
              select: {
                id: true,
                nom_complet: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const summary = {
      periode: {
        debut: startOfMonth.toISOString(),
        fin: endOfMonth.toISOString(),
      },
      caisses: {
        livrees: caissesLivrees,
        retournees: caissesRetournees,
        perdues: caissesPerdues,
        taux_perte: tauxPerte,
      },
      kilos: {
        depart: Math.round(kilosDepart * 100) / 100,
        retour: Math.round(kilosRetour * 100) / 100,
        livres: Math.round((kilosDepart - kilosRetour) * 100) / 100,
      },
      conflits: {
        total: conflicts.length,
        en_attente: conflicts.filter((c) => c.statut === "EN_ATTENTE").length,
        payes: conflicts.filter((c) => c.statut === "PAYEE").length,
        annules: conflicts.filter((c) => c.statut === "ANNULE").length,
      },
      tours_total: tours.length,
      tours_terminees: tours.filter((t) => t.statut === "TERMINEE").length,
    };

    return (
      <>
        <DashboardHeader breadcrumbs={[{ label: "Module Finance" }]} />
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <FinanceClient summary={summary} conflicts={conflicts} />
        </div>
      </>
    );
  } catch (error) {
    console.error("Error fetching finance data:", error);
    return (
      <>
        <DashboardHeader breadcrumbs={[{ label: "Module Finance" }]} />
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Erreur lors du chargement des données</p>
          </div>
        </div>
      </>
    );
  }
}
