import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import * as conflictService from '@/lib/conflict-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !['ADMIN', 'DIRECTION'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    const { id } = await params;
    const body = await request.json();
    const { type, quantite, montant, modePaiement, notes } = body;
    
    if (type === 'retour') {
      if (typeof quantite !== 'number' || quantite <= 0) {
        return NextResponse.json({ error: 'Quantité invalide' }, { status: 400 });
      }
      const result = await conflictService.enregistrerRetourCaisses(
        id, quantite, session.user.id, notes
      );
      return NextResponse.json(result);
      
    } else if (type === 'paiement') {
      if (typeof montant !== 'number' || montant <= 0) {
        return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
      }
      if (!modePaiement || !['ESPECES', 'RETENUE_SALAIRE'].includes(modePaiement)) {
        return NextResponse.json({ error: 'Mode de paiement invalide' }, { status: 400 });
      }
      const result = await conflictService.enregistrerPaiement(
        id, montant, modePaiement, session.user.id, notes
      );
      return NextResponse.json(result);
      
    } else {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
