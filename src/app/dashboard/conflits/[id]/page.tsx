import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConflictDetailClient } from "./conflict-detail-client";

interface ConflictDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConflictDetailPage({ params }: ConflictDetailPageProps) {
  const { id } = await params;
  
  const conflict = await prisma.conflict.findUnique({
    where: { id },
    include: {
      tour: {
        select: {
          id: true,
          matricule_vehicule: true,
          nbre_caisses_depart: true,
          nbre_caisses_retour: true,
          poids_brut_securite_sortie: true,
          poids_brut_securite_retour: true,
          statut: true,
          createdAt: true,
          driver: {
            select: {
              id: true,
              nom_complet: true,
              tolerance_caisses_mensuelle: true,
            },
          },
          secteur: {
            select: {
              id: true,
              nom: true,
            },
          },
          agentControle: {
            select: {
              id: true,
              name: true,
            },
          },
          lignesRetour: {
            select: {
              id: true,
              nbre_caisses: true,
              poids_net_retour: true,
              produit: {
                select: {
                  id: true,
                  nom: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!conflict) {
    notFound();
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Conflits", href: "/dashboard/conflits" },
          { label: `Conflit #${conflict.id.slice(0, 8)}...` }
        ]}
      />
      
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6">
          <ConflictDetailClient conflict={conflict} />
        </div>
      </ScrollArea>
    </div>
  );
}
