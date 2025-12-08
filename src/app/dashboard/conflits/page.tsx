import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, TruckIcon, User, Calendar, DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MatriculeDisplay from "@/components/MatriculeDisplay";
import { DashboardHeader } from "@/components/dashboard-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConflictActions } from "./conflict-actions";

export default async function ConflitsPage() {
  // Fetch all conflicts with related tour and driver data
  const conflicts = await prisma.conflict.findMany({
    include: {
      tour: {
        include: {
          driver: true,
          secteur: true,
          agentControle: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Group conflicts by status
  const pendingConflicts = conflicts.filter(c => c.statut === 'EN_ATTENTE');
  const approvedConflicts = conflicts.filter(c => c.statut === 'PAYEE');
  const rejectedConflicts = conflicts.filter(c => c.statut === 'ANNULE');

  // Calculate totals
  const totalPerte = conflicts.reduce((sum, c) => sum + c.quantite_perdue, 0);
  const totalMontant = conflicts.reduce((sum, c) => sum + c.montant_dette_tnd, 0);
  const conflitsDepasses = conflicts.filter(c => c.depasse_tolerance).length;

  const stats = [
    {
      label: "Conflits totaux",
      value: conflicts.length,
      icon: AlertCircle,
      color: "bg-red-500",
    },
    {
      label: "En attente",
      value: pendingConflicts.length,
      icon: Clock,
      color: "bg-orange-500",
    },
    {
      label: "Perte totale",
      value: `${totalPerte} caisses`,
      icon: TruckIcon,
      color: "bg-purple-500",
    },
    {
      label: "Montant total",
      value: `${totalMontant} TND`,
      icon: DollarSign,
      color: "bg-blue-500",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Conflits" }
        ]}
      />
      
      <ScrollArea className="flex-1">
        <div className="space-y-6 p-4 md:p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-none shadow-lg dark:bg-gray-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pending Conflicts */}
      {pendingConflicts.length > 0 && (
        <Card className="border-none shadow-lg dark:bg-gray-800/50 border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              Conflits en attente d'approbation
              <Badge variant="secondary" className="ml-2">
                {pendingConflicts.length}
              </Badge>
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Ces conflits nécessitent votre validation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingConflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className="p-5 rounded-xl bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/10 dark:to-gray-800/50 border-2 border-orange-200 dark:border-orange-700 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <MatriculeDisplay 
                        matricule={conflict.tour.matricule_vehicule}
                        size="lg"
                        className="text-2xl"
                      />
                      {conflict.depasse_tolerance && (
                        <Badge variant="destructive" className="text-xs">
                          ⚠️ Tolérance dépassée
                        </Badge>
                      )}
                    </div>
                    <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-none">
                      EN ATTENTE
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Chauffeur:</span> {conflict.tour.driver?.nom_complet || 'Non assigné'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <TruckIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Tolérance:</span> {conflict.tour.driver?.tolerance_caisses_mensuelle ?? 0} caisses
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                        <span className="text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Perte:</span> {conflict.quantite_perdue} caisses
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Montant:</span> {conflict.montant_dette_tnd} TND
                        </span>
                      </div>
                    </div>
                  </div>

                  <ConflictActions
                    conflictId={conflict.id}
                    driverName={conflict.tour.driver?.nom_complet || 'Non assigné'}
                    quantite={conflict.quantite_perdue}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approved Conflicts */}
      {approvedConflicts.length > 0 && (
        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              Conflits approuvés
              <Badge variant="secondary" className="ml-2">
                {approvedConflicts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {approvedConflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-white dark:from-green-900/10 dark:to-gray-800/50 border border-green-200 dark:border-green-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MatriculeDisplay 
                        matricule={conflict.tour.matricule_vehicule}
                        size="md"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {conflict.tour.driver?.nom_complet || 'Non assigné'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        -{conflict.quantite_perdue} caisses • {conflict.montant_dette_tnd} TND
                      </span>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-none">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        PAYÉE
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejected Conflicts */}
      {rejectedConflicts.length > 0 && (
        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              Conflits rejetés
              <Badge variant="secondary" className="ml-2">
                {rejectedConflicts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rejectedConflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-white dark:from-red-900/10 dark:to-gray-800/50 border border-red-200 dark:border-red-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MatriculeDisplay 
                        matricule={conflict.tour.matricule_vehicule}
                        size="md"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {conflict.tour.driver?.nom_complet || 'Non assigné'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        -{conflict.quantite_perdue} caisses • {conflict.montant_dette_tnd} TND
                      </span>
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        ANNULÉ
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {conflicts.length === 0 && (
        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Aucun conflit
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Toutes les livraisons se déroulent sans incident
              </p>
            </div>
          </CardContent>
        </Card>
      )}
        </div>
      </ScrollArea>
    </div>
  );
}
