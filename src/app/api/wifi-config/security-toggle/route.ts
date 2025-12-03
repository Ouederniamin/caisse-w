import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// POST: Toggle WiFi security on/off
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled must be a boolean' }, { status: 400 });
    }

    // Upsert the config
    const config = await prisma.appConfig.upsert({
      where: { key: 'WIFI_SECURITY_ENABLED' },
      update: { value: enabled.toString() },
      create: { 
        key: 'WIFI_SECURITY_ENABLED',
        value: enabled.toString()
      }
    });

    return NextResponse.json({ 
      enabled: config.value === 'true',
      message: enabled 
        ? 'WiFi security enabled - mobile app restricted to configured networks' 
        : 'WiFi security disabled - mobile app works on all networks (dev mode)'
    });
  } catch (error) {
    console.error('Error toggling security:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
