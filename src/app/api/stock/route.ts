import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import * as stockService from '@/lib/stock-service';

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    const stock = await stockService.getStock();
    return NextResponse.json(stock);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !['ADMIN', 'DIRECTION'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    const body = await request.json();
    const { action, quantite, notes } = body;
    
    switch (action) {
      case 'initialiser':
        if (typeof quantite !== 'number' || quantite < 0) {
          return NextResponse.json({ error: 'Quantité invalide' }, { status: 400 });
        }
        await stockService.initialiserStock(quantite, session.user.id);
        return NextResponse.json({ success: true, message: 'Stock initialisé' });
        
      case 'ajuster':
        if (typeof quantite !== 'number') {
          return NextResponse.json({ error: 'Quantité invalide' }, { status: 400 });
        }
        if (!notes) {
          return NextResponse.json({ error: 'Notes requises pour un ajustement' }, { status: 400 });
        }
        await stockService.ajusterStock(quantite, session.user.id, notes);
        return NextResponse.json({ success: true, message: 'Stock ajusté' });
        
      case 'achat':
        if (typeof quantite !== 'number' || quantite <= 0) {
          return NextResponse.json({ error: 'Quantité invalide' }, { status: 400 });
        }
        await stockService.enregistrerAchat(quantite, session.user.id, notes);
        return NextResponse.json({ success: true, message: 'Achat enregistré' });
        
      case 'reset-alerte':
        await stockService.resetAlertReference();
        return NextResponse.json({ success: true, message: 'Référence alerte réinitialisée' });
        
      default:
        return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
