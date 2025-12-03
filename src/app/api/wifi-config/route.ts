import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET: List all WiFi configs
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configs = await prisma.wiFiConfig.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ configs });
  } catch (error) {
    console.error('Error fetching WiFi configs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add new WiFi config
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ssid, bssid, description } = body;

    if (!ssid || !bssid) {
      return NextResponse.json({ error: 'SSID and BSSID are required' }, { status: 400 });
    }

    // Validate BSSID format (MAC address: XX:XX:XX:XX:XX:XX)
    const bssidRegex = /^([0-9A-Fa-f]{2}:){5}([0-9A-Fa-f]{2})$/;
    if (!bssidRegex.test(bssid)) {
      return NextResponse.json({ error: 'Invalid BSSID format. Expected format: XX:XX:XX:XX:XX:XX' }, { status: 400 });
    }

    const config = await prisma.wiFiConfig.create({
      data: {
        ssid,
        bssid: bssid.toUpperCase(),
        description,
        isActive: true
      }
    });

    return NextResponse.json({ config, message: 'WiFi configuration added successfully' });
  } catch (error: any) {
    console.error('Error creating WiFi config:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'This SSID/BSSID combination already exists' }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove WiFi config
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'WiFi config ID is required' }, { status: 400 });
    }

    await prisma.wiFiConfig.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'WiFi configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting WiFi config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
