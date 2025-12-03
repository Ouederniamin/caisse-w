"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  Key,
  Smartphone,
  Monitor,
  CheckCircle2,
  Shield,
  UserCog,
  Sparkles,
} from "lucide-react";
import { CopyButton } from "@/components/copy-button";

interface CredentialsClientProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export function CredentialsClient({ user }: CredentialsClientProps) {
  const webCredentials = [
    {
      email: "admin@test.com",
      password: "admin123",
      role: "Admin",
      description: "Accès complet + Gestion utilisateurs",
      color: "bg-purple-500",
      icon: Shield,
    },
    {
      email: "direction@test.com",
      password: "direction123",
      role: "Direction",
      description: "Dashboard complet opérationnel (sans gestion utilisateurs)",
      color: "bg-indigo-500",
      icon: UserCog,
    },
  ];

  const mobileCredentials = [
    {
      email: "controle@test.com",
      password: "controle123",
      role: "Agent Contrôle",
      description: "Contrôle des caisses au départ des tournées",
      color: "bg-blue-500",
      icon: CheckCircle2,
      permissions: ["Créer tournées", "Compter caisses", "Prendre photos"],
    },
    {
      email: "hygiene@test.com",
      password: "hygiene123",
      role: "Agent Hygiène",
      description: "Contrôle hygiène des véhicules au retour",
      color: "bg-green-500",
      icon: Sparkles,
      permissions: ["Contrôle hygiène", "Approuver véhicules", "Ajouter notes"],
    },
    {
      email: "securite@test.com",
      password: "securite123",
      role: "Sécurité",
      description: "Pesée des véhicules entrée/sortie",
      color: "bg-orange-500",
      icon: Shield,
      permissions: ["Pesée sortie", "Pesée entrée", "Enregistrer poids"],
    },
    {
      email: "admin@test.com",
      password: "admin123",
      role: "Admin",
      description: "Accès complet à toutes les fonctionnalités",
      color: "bg-purple-500",
      icon: UserCog,
      permissions: ["Accès complet", "Gestion utilisateurs", "Gestion conflits"],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header + Warning */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">🔐 Identifiants de Test</h1>
          <p className="text-muted-foreground">
            Identifiants pour tester l'application en mode développement
          </p>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">⚠️ Mode Développement Uniquement</AlertTitle>
          <AlertDescription className="text-sm">
            Ces identifiants sont destinés au développement et aux tests uniquement.
            <br />
            <strong>En production</strong>, tous les mots de passe doivent être hashés avec bcrypt/argon2 et
            jamais affichés en clair.
          </AlertDescription>
        </Alert>
      </div>

      {/* Two-column main layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Web + Security info */}
        <div className="space-y-6">
          {/* Web Dashboard Credentials */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Monitor className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Dashboard Web (Next.js)</CardTitle>
                  <CardDescription className="text-sm">
                    Identifiants pour accéder au dashboard administratif
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {webCredentials.map((cred, index) => {
                  const Icon = cred.icon;
                  return (
                    <Card key={index} className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${cred.color}`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <Badge className={`${cred.color} text-white mb-2`}>{cred.role}</Badge>
                            <p className="text-sm text-muted-foreground">{cred.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3 pt-3 border-t">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <span className="text-xs font-medium text-muted-foreground">Email:</span>
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-muted px-3 py-1.5 rounded-md font-mono">
                              {cred.email}
                            </code>
                            <CopyButton text={cred.email} />
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <span className="text-xs font-medium text-muted-foreground">Password:</span>
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-muted px-3 py-1.5 rounded-md font-mono">
                              {cred.password}
                            </code>
                            <CopyButton text={cred.password} />
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Security Info Cards */}
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-1">
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <CardTitle className="text-base">Dashboard Web</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  ✅ Mots de passe hashés avec <strong>BetterAuth (bcrypt)</strong>
                </p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 dark:border-yellow-800">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <CardTitle className="text-base">Mobile Backend</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  ⚠️ Stockage en clair en <strong>développement</strong> (à sécuriser)
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-800">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-600" />
                  <CardTitle className="text-base">Production</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  🔒 Hasher avec <strong>bcrypt/argon2</strong> obligatoire
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right: Mobile credentials + Quick access */}
        <div className="space-y-6">
          {/* Mobile App Credentials */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Application Mobile (Expo)</CardTitle>
                  <CardDescription className="text-sm">
                    Identifiants pour tester tous les rôles de l'application mobile
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[520px]">
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 pr-2">
                  {mobileCredentials.map((cred, index) => {
                    const Icon = cred.icon;
                    return (
                      <Card key={index} className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${cred.color}`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <Badge className={`${cred.color} text-white mb-2`}>{cred.role}</Badge>
                            <p className="text-xs text-muted-foreground">{cred.description}</p>
                          </div>
                        </div>

                        {cred.permissions && (
                          <div className="pt-2 mb-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Permissions:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {cred.permissions.map((perm, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs py-0.5">
                                  {perm}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-2 pt-3 border-t">
                          <div className="space-y-1.5">
                            <span className="text-xs font-medium text-muted-foreground">Email:</span>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 text-xs bg-muted px-2.5 py-1.5 rounded-md font-mono truncate">
                                {cred.email}
                              </code>
                              <CopyButton text={cred.email} />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-xs font-medium text-muted-foreground">Password:</span>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 text-xs bg-muted px-2.5 py-1.5 rounded-md font-mono">
                                {cred.password}
                              </code>
                              <CopyButton text={cred.password} />
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Quick Access Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Accès Rapide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Monitor className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Web Dashboard</p>
                    <a
                      href="http://localhost:3000"
                      className="text-xs text-blue-600 hover:underline break-all"
                    >
                      http://localhost:3000
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Smartphone className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Mobile App</p>
                    <p className="text-xs text-muted-foreground">Scanner QR code Expo</p>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-blue-100 dark:bg-blue-950/50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-blue-700 dark:text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> Base de données partagée entre web et mobile (PostgreSQL sur Neon)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-2" />
    </div>
  );
}
