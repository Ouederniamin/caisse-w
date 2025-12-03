import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Check if any user exists
    const usersCount = await prisma.user.count();

    if (usersCount > 0) {
      return NextResponse.json({ message: "Users already exist. Admin setup skipped." }, { status: 403 });
    }

    // Create admin user
    const adminUser = await auth.api.signUpEmail({
      body: {
        email: "admin@caisse.com",
        password: "adminpassword123",
        name: "Super Admin",
        role: "admin"
      }
    });

    return NextResponse.json({ 
      message: "Admin user created successfully", 
      credentials: { email: "admin@caisse.com", password: "adminpassword123" } 
    });
  } catch (error: any) {
    console.error("Setup admin error:", error);
    return NextResponse.json({ error: error.message || "Failed to create admin" }, { status: 500 });
  }
}
