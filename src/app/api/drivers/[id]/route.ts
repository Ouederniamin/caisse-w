import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const role = session?.user?.role?.toUpperCase();
    if (!session?.user || !["ADMIN", "DIRECTION"].includes(role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if driver has tours
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        _count: {
          select: { tours: true },
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    if (driver._count.tours > 0) {
      return NextResponse.json(
        { error: "Cannot delete driver with existing tours" },
        { status: 400 }
      );
    }

    await prisma.driver.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting driver:", error);
    return NextResponse.json(
      { error: "Failed to delete driver" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const role = session?.user?.role?.toUpperCase();
    if (!session?.user || !["ADMIN", "DIRECTION"].includes(role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { nom_complet, matricule_par_defaut, poids_tare_vehicule, tolerance_caisses_mensuelle } = body;

    const driver = await prisma.driver.update({
      where: { id },
      data: {
        ...(nom_complet && { nom_complet }),
        ...(matricule_par_defaut !== undefined && { matricule_par_defaut }),
        ...(poids_tare_vehicule !== undefined && { poids_tare_vehicule }),
        ...(tolerance_caisses_mensuelle !== undefined && { tolerance_caisses_mensuelle }),
      },
    });

    return NextResponse.json(driver);
  } catch (error) {
    console.error("Error updating driver:", error);
    return NextResponse.json(
      { error: "Failed to update driver" },
      { status: 500 }
    );
  }
}
