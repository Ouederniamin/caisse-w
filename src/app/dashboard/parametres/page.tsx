import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Database, TruckIcon, DollarSign, Shield, Bell, Mail, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import prisma from "@/lib/prisma";

export default async function ParametresPage() {
  // Fetch system settings from database
  const [driversCount, secteursCount, toursCount, usersCount] = await Promise.all([
    prisma.driver.count(),
    prisma.secteur.count(),
    prisma.tour.count(),
    prisma.user.count(),
  ]);

  const systemSettings = [
    {
      category: "Base de données",
      icon: Database,
      color: "bg-blue-500",
      settings: [
        { name: "Chauffeurs enregistrés", value: driversCount.toString() },
        { name: "Secteurs actifs", value: secteursCount.toString() },
        { name: "Tours totaux", value: toursCount.toString() },
        { name: "Utilisateurs", value: usersCount.toString() },
      ],
    },
    {
      category: "Configuration Tours",
      icon: TruckIcon,
      color: "bg-green-500",
      settings: [
        { name: "Statuts disponibles", value: "6 statuts" },
        { name: "Workflow hygiène", value: "Activé (produits poulet)" },
        { name: "Matricules", value: "Format tunisien" },
        { name: "Série actuelle", value: "261" },
      ],
    },
    {
      category: "Gestion Conflits",
      icon: DollarSign,
      color: "bg-red-500",
      settings: [
        { name: "Prix par caisse", value: "50 TND" },
        { name: "Tolérance par défaut", value: "Selon chauffeur" },
        { name: "Approbation requise", value: "Si tolérance dépassée" },
        { name: "Auto-calcul dette", value: "Activé" },
      ],
    },
    {
      category: "Sécurité",
      icon: Shield,
      color: "bg-purple-500",
      settings: [
        { name: "Authentification", value: "BetterAuth JWT" },
        { name: "Rôles utilisateurs", value: "5 rôles actifs" },
        { name: "Vérification WiFi", value: "Désactivée (mobile)" },
        { name: "Sessions", value: "Token persistant" },
      ],
    },
    {
      category: "Notifications",
      icon: Bell,
      color: "bg-yellow-500",
      settings: [
        { name: "Alertes conflits", value: "Bientôt disponible" },
        { name: "Email notifications", value: "Bientôt disponible" },
        { name: "SMS alerts", value: "Bientôt disponible" },
        { name: "Push notifications", value: "Bientôt disponible" },
      ],
    },
    {
      category: "API & Intégrations",
      icon: Server,
      color: "bg-indigo-500",
      settings: [
        { name: "Backend API", value: "Fastify (Port 3001)" },
        { name: "Endpoints actifs", value: "16 endpoints" },
        { name: "Base de données", value: "PostgreSQL (Neon)" },
        { name: "ORM", value: "Prisma 5.22.0" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl">
              <Settings className="h-8 w-8 text-white" />
            </div>
            Paramètres Système
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configuration et paramètres de l'application
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Version 1.0.0
        </Badge>
      </div>

      {/* System Info Banner */}
      <Card className="border-none shadow-lg dark:bg-gray-800/50 border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-green-600 dark:text-green-400" />
            État du système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tous les services sont opérationnels
              </span>
            </div>
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-none">
              Système stable
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {systemSettings.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.category} className="border-none shadow-lg dark:bg-gray-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${category.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  {category.category}
                </CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Configuration de {category.category.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.settings.map((setting) => (
                    <div
                      key={setting.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {setting.name}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {setting.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer Info */}
      <Card className="border-none shadow-lg dark:bg-gray-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Support & Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              📖 <span className="font-semibold">Documentation:</span> Voir TESTING_GUIDE.md pour les instructions complètes
            </p>
            <p>
              🚀 <span className="font-semibold">Stack:</span> Next.js 16 + Fastify + Prisma + PostgreSQL + Expo 54
            </p>
            <p>
              📱 <span className="font-semibold">Matricules:</span> Format tunisien avec numérotation automatique
            </p>
            <p>
              ✅ <span className="font-semibold">Workflow:</span> 6 statuts (sans EN_ATTENTE_NETTOYAGE)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
