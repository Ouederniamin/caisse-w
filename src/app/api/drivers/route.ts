import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const role = session?.user?.role?.toUpperCase();
    if (!session?.user || !["ADMIN", "DIRECTION"].includes(role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { nom_complet, matricule_par_defaut, poids_tare_vehicule, tolerance_caisses_mensuelle } = body;

    if (!nom_complet) {
      return NextResponse.json(
        { error: "Nom complet requis" },
        { status: 400 }
      );
    }

    const driver = await prisma.driver.create({
      data: {
        nom_complet,
        matricule_par_defaut: matricule_par_defaut || null,
        poids_tare_vehicule: poids_tare_vehicule || null,
        tolerance_caisses_mensuelle: tolerance_caisses_mensuelle || 0,
      },
    });

    return NextResponse.json(driver, { status: 201 });
  } catch (error) {
    console.error("Error creating driver:", error);
    return NextResponse.json(
      { error: "Failed to create driver" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const drivers = await prisma.driver.findMany({
      include: {
        _count: {
          select: {
            tours: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(drivers);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return NextResponse.json(
      { error: "Failed to fetch drivers" },
      { status: 500 }
    );
  }
}
