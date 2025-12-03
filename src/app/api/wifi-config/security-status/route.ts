import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET: Get WiFi security status
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await prisma.appConfig.findUnique({
      where: { key: 'WIFI_SECURITY_ENABLED' }
    });

    // Default to true (enabled) if not set
    const enabled = config?.value === 'true' || !config;

    return NextResponse.json({ 
      enabled,
      message: enabled ? 'WiFi security is enabled' : 'WiFi security is disabled (dev mode)'
    });
  } catch (error) {
    console.error('Error fetching security status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
