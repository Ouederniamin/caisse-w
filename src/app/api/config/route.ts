import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Default configuration values
const DEFAULT_CONFIG = {
  PRIX_CAISSE_TND: "15",
  SEUIL_ALERTE_STOCK_PCT: "10",
  TOLERANCE_CAISSES_DEFAULT: "5",
  MONTANT_DETTE_MULTIPLIER: "50",
  SERIE_MATRICULE_ACTUELLE: "253",
  WORKFLOW_HYGIENE_ENABLED: "true",
  AUTO_CALCUL_DETTE: "true",
  NOTIFICATIONS_ENABLED: "false",
  EMAIL_NOTIFICATIONS: "false",
  SMS_NOTIFICATIONS: "false",
};

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Check role - only ADMIN and DIRECTION can access
    const userRole = session.user.role || "AGENT_CONTROLE";
    if (!["ADMIN", "DIRECTION"].includes(userRole)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Get all config values from database
    const configs = await prisma.appConfig.findMany();
    
    // Build config object with defaults
    const configMap: Record<string, string> = { ...DEFAULT_CONFIG };
    configs.forEach((c) => {
      configMap[c.key] = c.value;
    });

    // Get stock info
    const stockCaisse = await prisma.stockCaisse.findFirst();

    return NextResponse.json({
      config: configMap,
      stock: stockCaisse ? {
        stock_initial: stockCaisse.stock_initial,
        stock_actuel: stockCaisse.stock_actuel,
        seuil_alerte_pct: stockCaisse.seuil_alerte_pct,
        initialise: stockCaisse.initialise,
      } : null,
      defaults: DEFAULT_CONFIG,
    });
  } catch (error: any) {
    console.error("Error fetching config:", error.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Check role - only ADMIN can modify
    const userRole = session.user.role || "AGENT_CONTROLE";
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Seul l'administrateur peut modifier les paramètres" }, { status: 403 });
    }

    const body = await request.json();
    const { config, stock } = body;

    // Update config values
    if (config && typeof config === "object") {
      for (const [key, value] of Object.entries(config)) {
        if (typeof value === "string") {
          await prisma.appConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value },
          });
        }
      }
    }

    // Update stock settings
    if (stock) {
      const existingStock = await prisma.stockCaisse.findFirst();
      if (existingStock) {
        await prisma.stockCaisse.update({
          where: { id: existingStock.id },
          data: {
            stock_initial: stock.stock_initial !== undefined ? parseInt(stock.stock_initial) : existingStock.stock_initial,
            seuil_alerte_pct: stock.seuil_alerte_pct !== undefined ? parseInt(stock.seuil_alerte_pct) : existingStock.seuil_alerte_pct,
          },
        });
      } else if (stock.stock_initial !== undefined) {
        await prisma.stockCaisse.create({
          data: {
            stock_initial: parseInt(stock.stock_initial),
            stock_actuel: parseInt(stock.stock_initial),
            seuil_alerte_pct: parseInt(stock.seuil_alerte_pct || "10"),
            initialise: true,
          },
        });
      }
    }

    // Log the change
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CONFIG_UPDATE",
        details_apres: JSON.stringify({ config, stock }),
      },
    });

    return NextResponse.json({ success: true, message: "Configuration mise à jour" });
  } catch (error: any) {
    console.error("Error updating config:", error.message);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}
