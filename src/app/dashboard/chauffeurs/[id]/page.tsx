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
    const driver = await prisma.driver.findUnique({
      where: { id },
      select: {
        id: true,
        nom_complet: true,
        matricule_par_defaut: true,
        tolerance_caisses_mensuelle: true,
        createdAt: true,
        updatedAt: true,
        tours: {
          select: {
            id: true,
            statut: true,
            createdAt: true,
            secteur: {
              select: {
                nom: true,
              },
            },
            _count: {
              select: {
                conflicts: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
        },
      },
    });

    if (!driver) {
      notFound();
    }

    return (
      <>
        <DashboardHeader
          breadcrumbs={[
            { label: "Chauffeurs", href: "/dashboard/chauffeurs" },
            { label: driver.nom_complet },
          ]}
        />
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <DriverDetailClient driver={driver} />
        </div>
      </>
    );
  } catch (error) {
    console.error("Error fetching driver:", error);
    notFound();
  }
}
