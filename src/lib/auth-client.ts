import { createAuthClient } from "better-auth/react";

// Use NEXT_PUBLIC_APP_URL for production, fallback to localhost for development
const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL,
});
