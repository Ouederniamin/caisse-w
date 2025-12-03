import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// PATCH: Toggle WiFi config active status
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, isActive } = body;

    if (!id || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'ID and isActive status are required' }, { status: 400 });
    }

    const config = await prisma.wiFiConfig.update({
      where: { id },
      data: { isActive }
    });

    return NextResponse.json({ config, message: 'WiFi configuration updated successfully' });
  } catch (error) {
    console.error('Error toggling WiFi config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
