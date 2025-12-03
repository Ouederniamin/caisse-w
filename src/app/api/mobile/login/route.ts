import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // Use BetterAuth to verify credentials
    const result = await auth.api.signInEmail({
      body: {
        email,
        password
      }
    });

    if (!result || !result.user) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Cast to include additional fields
    const user = result.user as typeof result.user & { role?: string };
    const response = result as typeof result & { session?: { token: string } };

    // Return the user and session token so the mobile app can store it
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'AGENT_CONTROLE'
      },
      token: response.token || response.session?.token || '',
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
