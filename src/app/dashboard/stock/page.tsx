import prisma from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StockClient } from "./stock-client";

export default async function StockPage() {
  const stock = await prisma.stockCaisse.findUnique({
    where: { id: 'stock-principal' }
  });
  
  const mouvements = await prisma.mouvementCaisse.findMany({
    include: {
      tour: { select: { id: true, matricule_vehicule: true } },
      conflict: { select: { id: true, quantite_perdue: true } },
      user: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  
  // Calculate stock en tournée
  const toursActifs = await prisma.tour.findMany({
    where: {
      statut: {
        in: ['EN_TOURNEE', 'EN_ATTENTE_DECHARGEMENT', 'EN_ATTENTE_HYGIENE']
      }
    },
    select: {
      nbre_caisses_depart: true,
      nbre_caisses_retour: true
    }
  });
  
  const stockEnTournee = toursActifs.reduce((sum, tour) => {
    return sum + tour.nbre_caisses_depart - (tour.nbre_caisses_retour || 0);
  }, 0);
  
  // Calculate losses
  const pertesConfirmees = await prisma.conflict.aggregate({
    where: { statut: 'RESOLUE' },
    _sum: { quantite_perdue: true, caisses_retournees: true }
  });
  
  const stockPerdu = (pertesConfirmees._sum.quantite_perdue || 0) - (pertesConfirmees._sum.caisses_retournees || 0);

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Stock Caisses" }
        ]}
      />
      
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6">
          <StockClient 
            stock={stock}
            mouvements={mouvements}
            stockEnTournee={stockEnTournee}
            stockPerdu={stockPerdu}
          />
        </div>
      </ScrollArea>
    </div>
  );
}
