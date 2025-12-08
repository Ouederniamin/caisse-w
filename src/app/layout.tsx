import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Caisse Management | Système de Gestion Professionnelle",
  description: "Plateforme B2B de gestion des tournées, chauffeurs et inventaire. Solution complète pour le suivi et la traçabilité des opérations de distribution.",
  keywords: ["caisse", "management", "B2B", "gestion tournées", "logistique", "distribution", "inventaire"],
  authors: [{ name: "Caisse Management" }],
  creator: "Caisse Management",
  publisher: "Caisse Management",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    title: "Caisse Management - Système de Gestion B2B",
    description: "Solution professionnelle de gestion des tournées et inventaire",
    siteName: "Caisse Management",
  },
  twitter: {
    card: "summary_large_image",
    title: "Caisse Management - Système de Gestion B2B",
    description: "Solution professionnelle de gestion des tournées et inventaire",
  },
  robots: {
    index: false, // B2B internal tool, no public indexing
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
