import prisma from './prisma';
import * as stockService from './stock-service';

// Get caisse value from config
async function getValeurCaisse(): Promise<number> {
  const config = await prisma.caisseConfig.findFirst();
  return config?.valeur_tnd || 50;
}

// Conflict state interface
export interface ConflictState {
  caissesRestantes: number;
  montantRestant: number;
  progressPct: number;
  estResolu: boolean;
  valeurCaisse: number;
}

// Calculate conflict state
export async function getConflictState(conflict: {
  quantite_perdue: number;
  caisses_retournees: number;
  montant_paye: number;
}): Promise<ConflictState> {
  const valeurCaisse = await getValeurCaisse();

  const caissesRestantes = conflict.quantite_perdue - conflict.caisses_retournees;
  const detteRestante = caissesRestantes * valeurCaisse;
  const montantRestant = Math.max(0, detteRestante - conflict.montant_paye);

  const totalValeur = conflict.quantite_perdue * valeurCaisse;
  const valeurResolue = (conflict.caisses_retournees * valeurCaisse) + conflict.montant_paye;
  const progressPct = totalValeur > 0 ? (valeurResolue / totalValeur) * 100 : 100;

  return {
    caissesRestantes,
    montantRestant,
    progressPct: Math.min(100, progressPct),
    estResolu: caissesRestantes === 0 || montantRestant <= 0,
    valeurCaisse
  };
}

// Register partial crate return
export async function enregistrerRetourCaisses(
  conflictId: string,
  quantite: number,
  userId: string,
  notes?: string
): Promise<{ success: boolean; message: string; resolved: boolean }> {
  return await prisma.$transaction(async (tx) => {
    const conflict = await tx.conflict.findUnique({
      where: { id: conflictId }
    });

    if (!conflict) {
      throw new Error('Conflit non trouvé');
    }

    if (conflict.statut === 'RESOLUE') {
      throw new Error('Ce conflit est déjà résolu');
    }

    const caissesRestantes = conflict.quantite_perdue - conflict.caisses_retournees;

    if (quantite > caissesRestantes) {
      throw new Error(`Maximum ${caissesRestantes} caisses peuvent être retournées`);
    }

    if (quantite <= 0) {
      throw new Error('La quantité doit être supérieure à 0');
    }

    // Update conflict
    const nouvellesTotalesRetournees = conflict.caisses_retournees + quantite;

    await tx.conflict.update({
      where: { id: conflictId },
      data: {
        caisses_retournees: nouvellesTotalesRetournees
      }
    });

    // Create resolution record
    await tx.resolutionConflict.create({
      data: {
        conflictId,
        type: 'RETOUR_CAISSES',
        quantite,
        userId,
        notes
      }
    });

    // Update stock (crates come back) - done outside transaction
    return { conflictId, quantite, userId, notes };
  }).then(async (data) => {
    // Update stock after transaction commits
    await stockService.enregistrerRetourConflit(data.conflictId, data.quantite, data.userId, data.notes);

    // Check if fully resolved
    const updatedConflict = await prisma.conflict.findUnique({
      where: { id: conflictId }
    });

    const state = await getConflictState(updatedConflict!);

    if (state.estResolu) {
      await prisma.conflict.update({
        where: { id: conflictId },
        data: { statut: 'RESOLUE' }
      });

      return {
        success: true,
        message: `${quantite} caisses retournées. Conflit résolu!`,
        resolved: true
      };
    }

    return {
      success: true,
      message: `${quantite} caisses retournées. Reste ${state.caissesRestantes} caisses ou ${state.montantRestant.toFixed(2)} TND à payer.`,
      resolved: false
    };
  });
}

// Register partial payment
export async function enregistrerPaiement(
  conflictId: string,
  montant: number,
  modePaiement: 'ESPECES' | 'RETENUE_SALAIRE',
  userId: string,
  notes?: string
): Promise<{ success: boolean; message: string; resolved: boolean }> {
  const conflict = await prisma.conflict.findUnique({
    where: { id: conflictId }
  });

  if (!conflict) {
    throw new Error('Conflit non trouvé');
  }

  if (conflict.statut === 'RESOLUE') {
    throw new Error('Ce conflit est déjà résolu');
  }

  const valeurCaisse = await getValeurCaisse();
  const caissesRestantes = conflict.quantite_perdue - conflict.caisses_retournees;
  const detteRestante = caissesRestantes * valeurCaisse;
  const montantRestant = detteRestante - conflict.montant_paye;

  if (montant > montantRestant + 0.01) { // Small tolerance for rounding
    throw new Error(`Maximum ${montantRestant.toFixed(2)} TND peut être payé`);
  }

  if (montant <= 0) {
    throw new Error('Le montant doit être supérieur à 0');
  }

  // Update conflict
  const nouveauMontantPaye = conflict.montant_paye + montant;

  await prisma.conflict.update({
    where: { id: conflictId },
    data: {
      montant_paye: nouveauMontantPaye
    }
  });

  // Create resolution record
  const modeLabel = modePaiement === 'ESPECES' ? 'en espèces' : 'par retenue salaire';
  await prisma.resolutionConflict.create({
    data: {
      conflictId,
      type: 'PAIEMENT',
      montant,
      modePaiement,
      userId,
      notes: notes || `Paiement ${modeLabel}`
    }
  });

  // Calculate how many crates this payment covers
  const caissesPayees = Math.floor(montant / valeurCaisse);

  // Register confirmed loss (audit)
  if (caissesPayees > 0) {
    await stockService.enregistrerPerteConfirmee(
      conflictId,
      caissesPayees,
      montant,
      userId,
      `Mode: ${modePaiement}`
    );
  }

  // Check if fully resolved
  const updatedConflict = await prisma.conflict.findUnique({
    where: { id: conflictId }
  });

  const state = await getConflictState(updatedConflict!);

  if (state.estResolu) {
    await prisma.conflict.update({
      where: { id: conflictId },
      data: { statut: 'RESOLUE' }
    });

    return {
      success: true,
      message: `Paiement de ${montant.toFixed(2)} TND enregistré. Conflit résolu!`,
      resolved: true
    };
  }

  return {
    success: true,
    message: `Paiement de ${montant.toFixed(2)} TND enregistré. Reste ${state.montantRestant.toFixed(2)} TND.`,
    resolved: false
  };
}

// Get resolution history
export async function getResolutionHistory(conflictId: string) {
  return await prisma.resolutionConflict.findMany({
    where: { conflictId },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });
}

// Get conflict with full state
export async function getConflictWithState(conflictId: string) {
  const conflict = await prisma.conflict.findUnique({
    where: { id: conflictId },
    include: {
      tour: {
        include: {
          driver: true,
          secteur: true
        }
      },
      resolutions: {
        include: {
          user: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!conflict) return null;

  const state = await getConflictState(conflict);

  return {
    ...conflict,
    state
  };
}
