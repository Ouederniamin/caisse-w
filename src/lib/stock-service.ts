import prisma from './prisma';

// Types
export interface StockState {
  stockActuel: number;
  stockEnTournee: number;
  stockDisponible: number;
  stockInitial: number;
  stockPerdu: number;
  initialise: boolean;
  alerteActive: boolean;
  alerteMessage?: string;
  seuilAlertePct: number;
}

// Initialize stock (first time setup)
export async function initialiserStock(
  quantite: number,
  userId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.stockCaisse.upsert({
      where: { id: 'stock-principal' },
      create: {
        id: 'stock-principal',
        stock_initial: quantite,
        stock_actuel: quantite,
        dernier_stock_ref: quantite,
        initialise: true
      },
      update: {
        stock_initial: quantite,
        stock_actuel: quantite,
        dernier_stock_ref: quantite,
        initialise: true
      }
    });

    await tx.mouvementCaisse.create({
      data: {
        type: 'INITIALISATION',
        quantite: quantite,
        solde_apres: quantite,
        userId,
        notes: 'Initialisation du stock'
      }
    });
  });
}

// Register tour departure
export async function enregistrerDepart(
  tourId: string,
  quantite: number,
  userId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const stock = await tx.stockCaisse.findUnique({
      where: { id: 'stock-principal' }
    });

    if (!stock?.initialise) {
      throw new Error('Stock non initialisé');
    }

    const nouveauSolde = stock.stock_actuel - quantite;

    await tx.stockCaisse.update({
      where: { id: 'stock-principal' },
      data: { stock_actuel: nouveauSolde }
    });

    await tx.mouvementCaisse.create({
      data: {
        type: 'DEPART_TOURNEE',
        quantite: -quantite,
        solde_apres: nouveauSolde,
        tourId,
        userId
      }
    });
  });
}

// Register tour return (handles surplus automatically)
export async function enregistrerRetour(
  tourId: string,
  quantiteDepart: number,
  quantiteRetour: number,
  userId: string
): Promise<{ surplus: number; perte: number }> {
  return await prisma.$transaction(async (tx) => {
    const stock = await tx.stockCaisse.findUnique({
      where: { id: 'stock-principal' }
    });

    if (!stock?.initialise) {
      throw new Error('Stock non initialisé');
    }

    const difference = quantiteDepart - quantiteRetour;
    let surplus = 0;
    let perte = 0;

    if (difference < 0) {
      // SURPLUS: more crates returned than departed
      surplus = Math.abs(difference);
      const nouveauSolde = stock.stock_actuel + quantiteRetour;

      await tx.mouvementCaisse.create({
        data: {
          type: 'RETOUR_TOURNEE',
          quantite: quantiteDepart,
          solde_apres: stock.stock_actuel + quantiteDepart,
          tourId,
          userId
        }
      });

      await tx.mouvementCaisse.create({
        data: {
          type: 'SURPLUS',
          quantite: surplus,
          solde_apres: nouveauSolde,
          tourId,
          userId,
          notes: `${surplus} caisses en surplus`
        }
      });

      await tx.stockCaisse.update({
        where: { id: 'stock-principal' },
        data: { stock_actuel: nouveauSolde }
      });
    } else {
      // Normal return or with loss
      perte = difference;
      const nouveauSolde = stock.stock_actuel + quantiteRetour;

      await tx.mouvementCaisse.create({
        data: {
          type: 'RETOUR_TOURNEE',
          quantite: quantiteRetour,
          solde_apres: nouveauSolde,
          tourId,
          userId,
          notes: perte > 0 ? `${perte} caisses manquantes` : undefined
        }
      });

      await tx.stockCaisse.update({
        where: { id: 'stock-principal' },
        data: { stock_actuel: nouveauSolde }
      });
    }

    return { surplus, perte };
  });
}

// Register crate return via conflict resolution
export async function enregistrerRetourConflit(
  conflictId: string,
  quantite: number,
  userId: string,
  notes?: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const stock = await tx.stockCaisse.findUnique({
      where: { id: 'stock-principal' }
    });

    const nouveauSolde = stock!.stock_actuel + quantite;

    await tx.stockCaisse.update({
      where: { id: 'stock-principal' },
      data: { stock_actuel: nouveauSolde }
    });

    await tx.mouvementCaisse.create({
      data: {
        type: 'RETOUR_CONFLIT',
        quantite: quantite,
        solde_apres: nouveauSolde,
        conflictId,
        userId,
        notes
      }
    });
  });
}

// Register confirmed loss (payment received - audit only, no stock change)
export async function enregistrerPerteConfirmee(
  conflictId: string,
  quantiteCaisses: number,
  montant: number,
  userId: string,
  notes?: string
): Promise<void> {
  const stock = await prisma.stockCaisse.findUnique({
    where: { id: 'stock-principal' }
  });

  await prisma.mouvementCaisse.create({
    data: {
      type: 'PERTE_CONFIRMEE',
      quantite: 0,
      solde_apres: stock!.stock_actuel,
      conflictId,
      userId,
      notes: `Paiement ${montant} TND pour ${quantiteCaisses} caisses. ${notes || ''}`
    }
  });
}

// Manual stock adjustment
export async function ajusterStock(
  quantite: number,
  userId: string,
  notes: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const stock = await tx.stockCaisse.findUnique({
      where: { id: 'stock-principal' }
    });

    const nouveauSolde = stock!.stock_actuel + quantite;

    await tx.stockCaisse.update({
      where: { id: 'stock-principal' },
      data: { stock_actuel: nouveauSolde }
    });

    await tx.mouvementCaisse.create({
      data: {
        type: 'AJUSTEMENT',
        quantite,
        solde_apres: nouveauSolde,
        userId,
        notes
      }
    });
  });
}

// Purchase new crates
export async function enregistrerAchat(
  quantite: number,
  userId: string,
  notes?: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const stock = await tx.stockCaisse.findUnique({
      where: { id: 'stock-principal' }
    });

    const nouveauSolde = stock!.stock_actuel + quantite;

    await tx.stockCaisse.update({
      where: { id: 'stock-principal' },
      data: {
        stock_actuel: nouveauSolde,
        stock_initial: stock!.stock_initial + quantite,
        dernier_stock_ref: nouveauSolde
      }
    });

    await tx.mouvementCaisse.create({
      data: {
        type: 'ACHAT',
        quantite,
        solde_apres: nouveauSolde,
        userId,
        notes: notes || `Achat de ${quantite} nouvelles caisses`
      }
    });
  });
}

// Reset alert reference after acknowledgment
export async function resetAlertReference(): Promise<void> {
  const stock = await prisma.stockCaisse.findUnique({
    where: { id: 'stock-principal' }
  });

  if (stock) {
    await prisma.stockCaisse.update({
      where: { id: 'stock-principal' },
      data: { dernier_stock_ref: stock.stock_actuel }
    });
  }
}

// Get current stock state
export async function getStock(): Promise<StockState> {
  const stock = await prisma.stockCaisse.findUnique({
    where: { id: 'stock-principal' }
  });

  if (!stock) {
    return {
      stockActuel: 0,
      stockEnTournee: 0,
      stockDisponible: 0,
      stockInitial: 0,
      stockPerdu: 0,
      initialise: false,
      alerteActive: false,
      seuilAlertePct: 10
    };
  }

  // Calculate stock in active tours
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

  // Calculate total losses from resolved conflicts
  const pertes = await prisma.conflict.aggregate({
    where: { statut: 'RESOLUE' },
    _sum: { quantite_perdue: true, caisses_retournees: true }
  });

  const stockPerdu = (pertes._sum.quantite_perdue || 0) - (pertes._sum.caisses_retournees || 0);

  // Check alert
  const baissePct = stock.dernier_stock_ref > 0
    ? ((stock.dernier_stock_ref - stock.stock_actuel) / stock.dernier_stock_ref) * 100
    : 0;
  const alerteActive = baissePct >= stock.seuil_alerte_pct;

  return {
    stockActuel: stock.stock_actuel,
    stockEnTournee,
    stockDisponible: stock.stock_actuel,
    stockInitial: stock.stock_initial,
    stockPerdu,
    initialise: stock.initialise,
    alerteActive,
    alerteMessage: alerteActive
      ? `⚠️ Stock en baisse de ${baissePct.toFixed(1)}% depuis la dernière vérification`
      : undefined,
    seuilAlertePct: stock.seuil_alerte_pct
  };
}

// Check if stock is initialized
export async function isStockInitialise(): Promise<boolean> {
  const stock = await prisma.stockCaisse.findUnique({
    where: { id: 'stock-principal' }
  });
  return stock?.initialise ?? false;
}
