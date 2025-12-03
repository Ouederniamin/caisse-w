import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface DetectedNetwork {
  ssid: string;
  bssid: string;
  signal: number;
}

// GET: Detect available WiFi networks
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const networks: DetectedNetwork[] = [];

    try {
      // Windows command to get WiFi information
      const { stdout } = await execAsync('netsh wlan show networks mode=bssid', { 
        encoding: 'utf-8',
        timeout: 10000 
      });

      // Parse the output
      const lines = stdout.split('\n');
      let currentSSID = '';
      let currentBSSID = '';
      let currentSignal = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Match SSID line
        if (line.startsWith('SSID')) {
          const match = line.match(/SSID\s+\d+\s*:\s*(.+)/);
          if (match && match[1]) {
            currentSSID = match[1].trim();
          }
        }

        // Match BSSID line
        if (line.startsWith('BSSID')) {
          const match = line.match(/BSSID\s+\d+\s*:\s*([0-9a-fA-F:]+)/);
          if (match && match[1]) {
            currentBSSID = match[1].trim().toUpperCase();
          }
        }

        // Match Signal line
        if (line.includes('Signal') || line.includes('signal')) {
          const match = line.match(/(\d+)%/);
          if (match && match[1]) {
            currentSignal = parseInt(match[1]);
          }
        }

        // When we have all three pieces of info, add to networks
        if (currentSSID && currentBSSID && currentSignal > 0) {
          // Avoid duplicates
          const exists = networks.some(n => n.bssid === currentBSSID);
          if (!exists && currentSSID !== '') {
            networks.push({
              ssid: currentSSID,
              bssid: currentBSSID,
              signal: currentSignal
            });
          }
          // Reset for next network
          currentSSID = '';
          currentBSSID = '';
          currentSignal = 0;
        }
      }

      // Sort by signal strength
      networks.sort((a, b) => b.signal - a.signal);

      return NextResponse.json({ 
        networks,
        count: networks.length,
        message: networks.length > 0 
          ? `${networks.length} réseau(x) détecté(s)` 
          : 'Aucun réseau WiFi détecté'
      });

    } catch (execError: any) {
      console.error('Error executing netsh command:', execError);
      
      // Fallback: Try to get current connection only
      try {
        const { stdout: interfaceInfo } = await execAsync('netsh wlan show interfaces', {
          encoding: 'utf-8',
          timeout: 5000
        });

        const ssidMatch = interfaceInfo.match(/SSID\s*:\s*(.+)/);
        const bssidMatch = interfaceInfo.match(/BSSID\s*:\s*([0-9a-fA-F:]+)/);
        const signalMatch = interfaceInfo.match(/Signal\s*:\s*(\d+)%/);

        if (ssidMatch && bssidMatch) {
          networks.push({
            ssid: ssidMatch[1].trim(),
            bssid: bssidMatch[1].trim().toUpperCase(),
            signal: signalMatch ? parseInt(signalMatch[1]) : 100
          });
        }

        if (networks.length > 0) {
          return NextResponse.json({ 
            networks,
            count: networks.length,
            message: 'Réseau actuel détecté (connexion active uniquement)'
          });
        }
      } catch (fallbackError) {
        console.error('Fallback detection also failed:', fallbackError);
      }

      return NextResponse.json({ 
        error: 'Impossible de détecter les réseaux WiFi. Assurez-vous que le WiFi est activé et que vous utilisez Windows.',
        networks: [],
        count: 0
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in detect endpoint:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur lors de la détection',
      networks: [],
      count: 0
    }, { status: 500 });
  }
}
