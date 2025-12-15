import { DashboardHeader } from "@/components/dashboard-header";
import prisma from "@/lib/prisma";
import { FinanceClient } from "./finance-client";

export default async function FinancePage() {
  try {
    // Get current month dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get last month dates for comparison
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

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
    });

    // Fetch last month tours for comparison
    const lastMonthTours = await prisma.tour.findMany({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
      select: {
        nbre_caisses_depart: true,
        nbre_caisses_retour: true,
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

    // Last month stats for comparison
    let lastMonthCaissesLivrees = 0;
    let lastMonthCaissesPerdues = 0;
    lastMonthTours.forEach((tour) => {
      lastMonthCaissesLivrees += tour.nbre_caisses_depart;
      lastMonthCaissesPerdues += tour.nbre_caisses_depart - (tour.nbre_caisses_retour || 0);
    });

    const caissesPerdues = caissesLivrees - caissesRetournees;
    const tauxPerte = caissesLivrees > 0 ? Math.round((caissesPerdues / caissesLivrees) * 10000) / 100 : 0;
    const lastMonthTauxPerte = lastMonthCaissesLivrees > 0 
      ? Math.round((lastMonthCaissesPerdues / lastMonthCaissesLivrees) * 10000) / 100 
      : 0;

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
        depasse_tolerance: true,
        createdAt: true,
        tour: {
          select: {
            matricule_vehicule: true,
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

    // Fetch all-time conflicts for debt tracking
    const allConflicts = await prisma.conflict.findMany({
      select: {
        statut: true,
        montant_dette_tnd: true,
        quantite_perdue: true,
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
    });

    // Calculate debt totals
    const totalDebt = allConflicts
      .filter(c => c.statut === "EN_ATTENTE")
      .reduce((sum, c) => sum + c.montant_dette_tnd, 0);
    
    const paidDebt = allConflicts
      .filter(c => c.statut === "PAYEE")
      .reduce((sum, c) => sum + c.montant_dette_tnd, 0);

    const cancelledDebt = allConflicts
      .filter(c => c.statut === "ANNULE")
      .reduce((sum, c) => sum + c.montant_dette_tnd, 0);

    // Calculate driver debt rankings
    const driverDebtMap = new Map<string, { name: string; debt: number; caisses: number; conflicts: number }>();
    allConflicts.forEach((conflict) => {
      if (conflict.statut === "EN_ATTENTE" && conflict.tour.driver) {
        const driverId = conflict.tour.driver.id;
        const existing = driverDebtMap.get(driverId) || { 
          name: conflict.tour.driver.nom_complet, 
          debt: 0, 
          caisses: 0, 
          conflicts: 0 
        };
        existing.debt += conflict.montant_dette_tnd;
        existing.caisses += conflict.quantite_perdue;
        existing.conflicts += 1;
        driverDebtMap.set(driverId, existing);
      }
    });

    const driverDebts = Array.from(driverDebtMap.values())
      .sort((a, b) => b.debt - a.debt)
      .slice(0, 10);

    // Calculate secteur stats
    const secteurMap = new Map<string, { name: string; tours: number; caisses: number; lost: number }>();
    tours.forEach((tour) => {
      if (tour.secteur) {
        const existing = secteurMap.get(tour.secteur.id) || { 
          name: tour.secteur.nom, 
          tours: 0, 
          caisses: 0,
          lost: 0
        };
        existing.tours += 1;
        existing.caisses += tour.nbre_caisses_depart;
        existing.lost += tour.nbre_caisses_depart - (tour.nbre_caisses_retour || 0);
        secteurMap.set(tour.secteur.id, existing);
      }
    });

    const secteurStats = Array.from(secteurMap.values())
      .sort((a, b) => b.tours - a.tours);

    // Daily stats for the month (for chart)
    const dailyStats: { date: string; tours: number; caisses: number; lost: number }[] = [];
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(now.getFullYear(), now.getMonth(), day);
      const dayTours = tours.filter(t => {
        const tourDate = new Date(t.createdAt);
        return tourDate.getDate() === day;
      });
      
      const dayCaisses = dayTours.reduce((sum, t) => sum + t.nbre_caisses_depart, 0);
      const dayLost = dayTours.reduce((sum, t) => sum + (t.nbre_caisses_depart - (t.nbre_caisses_retour || 0)), 0);
      
      dailyStats.push({
        date: dayDate.toISOString(),
        tours: dayTours.length,
        caisses: dayCaisses,
        lost: dayLost,
      });
    }

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
        taux_perte_mois_dernier: lastMonthTauxPerte,
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
        depasse_tolerance: conflicts.filter((c) => c.depasse_tolerance).length,
      },
      dette: {
        total_en_attente: Math.round(totalDebt * 100) / 100,
        total_payee: Math.round(paidDebt * 100) / 100,
        total_annulee: Math.round(cancelledDebt * 100) / 100,
        ce_mois: Math.round(conflicts.reduce((sum, c) => sum + c.montant_dette_tnd, 0) * 100) / 100,
      },
      tours_total: tours.length,
      tours_terminees: tours.filter((t) => t.statut === "TERMINEE").length,
    };

    return (
      <>
        <DashboardHeader breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Finance" }
        ]} />
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <FinanceClient 
            summary={summary} 
            conflicts={conflicts} 
            driverDebts={driverDebts}
            secteurStats={secteurStats}
            dailyStats={dailyStats}
          />
        </div>
      </>
    );
  } catch (error) {
    console.error("Error fetching finance data:", error);
    return (
      <>
        <DashboardHeader breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Finance" }
        ]} />
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Erreur lors du chargement des données</p>
          </div>
        </div>
      </>
    );
  }
}
