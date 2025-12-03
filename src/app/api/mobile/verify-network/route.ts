import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST: Verify if mobile device is on trusted WiFi network
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ssid, bssid } = body;

    if (!ssid || !bssid) {
      return NextResponse.json({ 
        allowed: false, 
        error: 'SSID and BSSID are required' 
      }, { status: 400 });
    }

    // Check if WiFi security is enabled
    const wifiSecurityConfig = await prisma.appConfig.findUnique({
      where: { key: 'WIFI_SECURITY_ENABLED' }
    });

    // If WiFi security is disabled, allow all networks
    if (!wifiSecurityConfig || wifiSecurityConfig.value === 'false') {
      return NextResponse.json({ 
        allowed: true, 
        message: 'WiFi security is disabled - all networks allowed',
        mode: 'DISABLED'
      });
    }

    // Check if any WiFi config is active
    const activeConfigs = await prisma.wiFiConfig.findMany({
      where: { isActive: true }
    });

    // If no active configs, allow access (WiFi restriction disabled)
    if (activeConfigs.length === 0) {
      return NextResponse.json({ 
        allowed: true, 
        message: 'No WiFi restrictions configured',
        mode: 'NO_RESTRICTIONS'
      });
    }

    // Normalize BSSID to uppercase for comparison
    const normalizedBssid = bssid.toUpperCase();

    // Check if the provided SSID + BSSID combination is in the whitelist
    const matchingConfig = activeConfigs.find(
      config => config.ssid === ssid && config.bssid === normalizedBssid
    );

    if (matchingConfig) {
      return NextResponse.json({ 
        allowed: true, 
        message: 'Network verified successfully',
        configId: matchingConfig.id,
        mode: 'RESTRICTED'
      });
    }

    // Not on trusted network
    return NextResponse.json({ 
      allowed: false, 
      error: 'You must be connected to an authorized WiFi network',
      reason: 'SSID/BSSID combination not found in whitelist',
      mode: 'RESTRICTED'
    }, { status: 403 });

  } catch (error) {
    console.error('Error verifying network:', error);
    return NextResponse.json({ 
      allowed: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
