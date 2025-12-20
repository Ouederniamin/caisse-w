import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '50';
    const type = searchParams.get('type') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    const queryParams = new URLSearchParams({ page, limit });
    if (type) queryParams.set('type', type);
    if (startDate) queryParams.set('startDate', startDate);
    if (endDate) queryParams.set('endDate', endDate);
    
    const response = await fetch(`${BACKEND_URL}/api/dashboard/mouvements?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Mouvements fetch error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
