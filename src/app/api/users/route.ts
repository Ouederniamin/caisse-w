import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Only Admin can create users
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Cast session to include role
  const sessionUser = session.user as typeof session.user & { role?: string };

  if (sessionUser?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { email, password, name, role } = body;

    if (!email || !password || !role || !name) {
        return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    // Create user using BetterAuth server API
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      }
    });

    if (!result?.user) {
      return NextResponse.json(
        { error: "Email déjà utilisé ou invalide" },
        { status: 400 }
      );
    }

    // Update user role using Prisma
    const prisma = (await import("@/lib/prisma")).default;
    const updatedUser = await prisma.user.update({
      where: { id: result.user.id },
      data: { role },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: unknown) {
    console.error("Error creating user:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
