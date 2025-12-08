import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdminClient } from "./admin-client";
import { format, subDays } from "date-fns";

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  if (session.user.role?.toUpperCase() !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch all data in parallel
  const [tours, conflicts, drivers, users, secteurs] = await Promise.all([
    prisma.tour.findMany({
      include: {
        driver: true,
        secteur: true,
        conflicts: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.conflict.findMany({
      include: {
        tour: {
          include: {
            driver: true,
            secteur: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.driver.findMany(),
    prisma.user.findMany(),
    prisma.secteur.findMany({
      include: {
        tours: {
          include: {
            conflicts: true,
          },
        },
      },
    }),
  ]);

  // Calculate statistics
  const totalTours = tours.length;
  const activeTours = tours.filter((t) =>
    ["EN_TOURNEE", "PRET_A_PARTIR"].includes(t.statut)
  ).length;
  const completedTours = tours.filter((t) => t.statut === "TERMINEE").length;
  
  const totalConflicts = conflicts.length;
  const pendingConflicts = conflicts.filter((c) => c.statut === "EN_ATTENTE").length;
  const paidConflicts = conflicts.filter((c) => c.statut === "PAYEE").length;
  const totalDebt = conflicts
    .filter((c) => c.statut === "EN_ATTENTE")
    .reduce((sum, c) => sum + c.montant_dette_tnd, 0);

  const totalDrivers = drivers.length;
  const totalUsers = users.length;

  const totalCaissesDeparture = tours.reduce(
    (sum, t) => sum + t.nbre_caisses_depart,
    0
  );
  const totalCaissesReturned = tours.reduce(
    (sum, t) => sum + (t.nbre_caisses_retour ?? 0),
    0
  );
  const avgCaissesPerTour =
    totalTours > 0 ? totalCaissesDeparture / totalTours : 0;

  // Tours by status
  const STATUS_CONFIG = {
    PREPARATION: { label: "Préparation", color: "#6b7280" },
    PRET_A_PARTIR: { label: "Prêt à partir", color: "#3b82f6" },
    EN_TOURNEE: { label: "En tournée", color: "#8b5cf6" },
    EN_ATTENTE_DECHARGEMENT: { label: "Attente déchargement", color: "#f97316" },
    EN_ATTENTE_HYGIENE: { label: "Attente hygiène", color: "#f59e0b" },
    TERMINEE: { label: "Terminée", color: "#10b981" },
  };

  const toursByStatus = Object.entries(STATUS_CONFIG).map(([status, config]) => ({
    status: config.label,
    count: tours.filter((t) => t.statut === status).length,
    color: config.color,
  }));

  // Conflicts by status
  const conflictsByStatus = [
    { status: "En attente", count: pendingConflicts },
    { status: "Payée", count: paidConflicts },
    {
      status: "Annulé",
      count: conflicts.filter((c) => c.statut === "ANNULE").length,
    },
  ];

  // Tours over time (last 7 days)
  const toursOverTime = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "dd/MM");
    const count = tours.filter(
      (t) =>
        format(new Date(t.createdAt), "dd/MM/yyyy") ===
        format(date, "dd/MM/yyyy")
    ).length;
    return { date: dateStr, count };
  });

  // Conflict trend (last 7 days)
  const conflictTrend = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "dd/MM");
    const amount = conflicts
      .filter(
        (c) =>
          format(new Date(c.createdAt), "dd/MM/yyyy") ===
          format(date, "dd/MM/yyyy")
      )
      .reduce((sum, c) => sum + c.montant_dette_tnd, 0);
    return { date: dateStr, amount };
  });

  // Top drivers by tour count
  const driverStats = drivers.map((driver) => {
    const driverTours = tours.filter((t) => t.driverId === driver.id);
    const driverConflicts = driverTours.reduce(
      (sum, t) => sum + t.conflicts.length,
      0
    );
    return {
      name: driver.nom_complet,
      tours: driverTours.length,
      conflicts: driverConflicts,
    };
  });
  const topDrivers = driverStats
    .sort((a, b) => b.tours - a.tours)
    .slice(0, 5);

  // Sector performance
  const sectorPerformance = secteurs.map((secteur) => {
    const sectorTours = secteur.tours.length;
    const sectorConflicts = secteur.tours.reduce(
      (sum, t) => sum + t.conflicts.length,
      0
    );
    const conflictRate =
      sectorTours > 0 ? (sectorConflicts / sectorTours) * 100 : 0;
    return {
      sector: secteur.nom,
      tours: sectorTours,
      conflicts: sectorConflicts,
      conflictRate,
    };
  });

  const stats = {
    totalTours,
    activeTours,
    completedTours,
    totalConflicts,
    pendingConflicts,
    paidConflicts,
    totalDebt,
    totalDrivers,
    totalUsers,
    totalCaissesDeparture,
    totalCaissesReturned,
    avgCaissesPerTour,
    toursByStatus,
    conflictsByStatus,
    toursOverTime,
    conflictTrend,
    topDrivers,
    sectorPerformance,
  };

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin" }
        ]}
      />
      
      <ScrollArea className="flex-1">
        <div className="space-y-6 p-4 md:p-6">
          <AdminClient stats={stats} />
        </div>
      </ScrollArea>
    </div>
  );
}
