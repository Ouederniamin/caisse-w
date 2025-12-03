"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TruckIcon, Package, Activity, CheckCircle, AlertCircle, MapPin, User, Calendar } from "lucide-react";
import MatriculeDisplay from "@/components/MatriculeDisplay";

const STATUS_ORDER = [
  "PREPARATION",
  "PRET_A_PARTIR",
  "EN_TOURNEE",
  "EN_ATTENTE_DECHARGEMENT",
  "EN_ATTENTE_HYGIENE",
  "TERMINEE",
] as const;

type StatusKey = (typeof STATUS_ORDER)[number];

type Tour = {
  id: string;
  statut: StatusKey;
  matricule_vehicule: string;
  nbre_caisses_depart: number;
  nbre_caisses_retour: number | null;
  createdAt: string | Date;
  conflicts: { id: string }[];
  driver: { nom_complet: string };
  secteur: { nom: string };
};

interface ToursClientProps {
  tours: Tour[];
}

export function ToursClient({ tours }: ToursClientProps) {
  const statusConfig = useMemo(() => ({
    PREPARATION: {
      label: "Préparation",
      color: "text-gray-700 dark:text-gray-300",
      bgColor: "bg-gray-100 dark:bg-gray-700",
      icon: Package,
    },
    PRET_A_PARTIR: {
      label: "Prêt à partir",
      color: "text-blue-700 dark:text-blue-300",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      icon: TruckIcon,
    },
    EN_TOURNEE: {
      label: "En tournée",
      color: "text-purple-700 dark:text-purple-300",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      icon: Activity,
    },
    EN_ATTENTE_DECHARGEMENT: {
      label: "Attente déchargement",
      color: "text-orange-700 dark:text-orange-300",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      icon: Package,
    },
    EN_ATTENTE_HYGIENE: {
      label: "Attente hygiène",
      color: "text-yellow-700 dark:text-yellow-300",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      icon: AlertCircle,
    },
    TERMINEE: {
      label: "Terminée",
      color: "text-green-700 dark:text-green-300",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      icon: CheckCircle,
    },
  }), []);

  const stats = useMemo(() => [
    {
      label: "Total Tours",
      value: tours.length,
      icon: TruckIcon,
      color: "bg-blue-500",
    },
    {
      label: "En cours",
      value: tours.filter(t => ['EN_TOURNEE', 'PRET_A_PARTIR'].includes(t.statut)).length,
      icon: Activity,
      color: "bg-purple-500",
    },
    {
      label: "Terminées",
      value: tours.filter(t => t.statut === 'TERMINEE').length,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      label: "Avec conflits",
      value: tours.filter(t => t.conflicts.length > 0).length,
      icon: AlertCircle,
      color: "bg-red-500",
    },
  ], [tours]);
  const [selectedStatus, setSelectedStatus] = useState<StatusKey | "ALL">("ALL");

  const toursByStatus = tours.reduce<Record<string, Tour[]>>((acc, tour) => {
    if (!acc[tour.statut]) acc[tour.statut] = [];
    acc[tour.statut].push(tour);
    return acc;
  }, {});

  const statusFilters = [
    { key: "ALL" as const, label: "Tous" },
    ...STATUS_ORDER.map((key) => ({
      key,
      label: statusConfig[key]?.label ?? key,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-none shadow-lg dark:bg-gray-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
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

      {/* Status Filter Bar */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => {
          const isActive = selectedStatus === filter.key;
          const config =
            filter.key === "ALL" ? undefined : statusConfig[filter.key as StatusKey];
          const Icon =
            filter.key === "ALL"
              ? TruckIcon
              : (config?.icon as typeof TruckIcon | undefined) ?? TruckIcon;

          return (
            <Button
              key={filter.key}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setSelectedStatus(filter.key as StatusKey | "ALL")}
            >
              <Icon className="h-4 w-4" />
              <span>{filter.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Tours by Status */}
      {STATUS_ORDER.map((status) => {
        if (selectedStatus !== "ALL" && selectedStatus !== status) return null;

        const statusTours = toursByStatus[status] ?? [];
        const config = statusConfig[status];
        if (!config) return null;
        const Icon = config.icon;

        return (
          <Card key={status} className="border-none shadow-lg dark:bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${config.color}`} />
                {config.label}
                <Badge variant="secondary" className="ml-2">
                  {statusTours.length}
                </Badge>
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Tours actuellement en statut {config.label.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statusTours.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun tour dans ce statut</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {statusTours.map((tour) => (
                      <div
                        key={tour.id}
                        className="p-4 rounded-xl bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <MatriculeDisplay
                              matricule={tour.matricule_vehicule}
                              size="lg"
                              className="text-2xl"
                            />
                            {tour.conflicts.length > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {tour.conflicts.length} conflit(s)
                              </Badge>
                            )}
                          </div>
                          <Badge className={`${config.bgColor} ${config.color} border-none`}>
                            {config.label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {tour.driver.nom_complet}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {tour.secteur.nom}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {tour.nbre_caisses_depart} caisses
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {new Date(tour.createdAt).toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                        </div>

                        {tour.nbre_caisses_retour !== null && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Retour:</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {tour.nbre_caisses_retour} caisses
                                {tour.nbre_caisses_retour < tour.nbre_caisses_depart && (
                                  <span className="text-red-600 dark:text-red-400 ml-2">
                                    (-{tour.nbre_caisses_depart - tour.nbre_caisses_retour})
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
