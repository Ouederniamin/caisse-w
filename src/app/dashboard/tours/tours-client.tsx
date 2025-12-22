"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TruckIcon, Package, Activity, CheckCircle, AlertCircle, MapPin, User, Calendar, Eye, Search, X } from "lucide-react";
import MatriculeDisplay from "@/components/MatriculeDisplay";
import MatriculeInput from "@/components/MatriculeInput";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUS_ORDER = [
  "PESEE_VIDE",
  "EN_CHARGEMENT",
  "PRET_A_PARTIR",
  "EN_TOURNEE",
  "RETOUR",
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
  driver: { nom_complet: string } | null;
  secteur: { nom: string } | null;
};

interface ToursClientProps {
  tours: Tour[];
}

export function ToursClient({ tours }: ToursClientProps) {
  const [selectedStatus, setSelectedStatus] = useState<StatusKey | "ALL">("ALL");
  const [matriculeSearch, setMatriculeSearch] = useState("");

  const statusConfig = useMemo(() => ({
    PESEE_VIDE: {
      label: "Pesée à vide",
      color: "text-gray-700 dark:text-gray-300",
      bgColor: "bg-gray-100 dark:bg-gray-700",
      badgeColor: "bg-gray-500",
      icon: Package,
    },
    EN_CHARGEMENT: {
      label: "En chargement",
      color: "text-amber-700 dark:text-amber-300",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      badgeColor: "bg-amber-500",
      icon: Package,
    },
    PRET_A_PARTIR: {
      label: "Prêt à partir",
      color: "text-blue-700 dark:text-blue-300",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      badgeColor: "bg-blue-500",
      icon: TruckIcon,
    },
    EN_TOURNEE: {
      label: "En tournée",
      color: "text-purple-700 dark:text-purple-300",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      badgeColor: "bg-purple-500",
      icon: Activity,
    },
    RETOUR: {
      label: "Retour usine",
      color: "text-violet-700 dark:text-violet-300",
      bgColor: "bg-violet-100 dark:bg-violet-900/30",
      badgeColor: "bg-violet-500",
      icon: TruckIcon,
    },
    EN_ATTENTE_DECHARGEMENT: {
      label: "Déchargé",
      color: "text-teal-700 dark:text-teal-300",
      bgColor: "bg-teal-100 dark:bg-teal-900/30",
      badgeColor: "bg-teal-500",
      icon: Package,
    },
    EN_ATTENTE_HYGIENE: {
      label: "Attente hygiène",
      color: "text-yellow-700 dark:text-yellow-300",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      badgeColor: "bg-yellow-500",
      icon: AlertCircle,
    },
    TERMINEE: {
      label: "Terminée",
      color: "text-green-700 dark:text-green-300",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      badgeColor: "bg-green-500",
      icon: CheckCircle,
    },
  }), []);

  // Count tours by status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: tours.length };
    STATUS_ORDER.forEach(status => {
      counts[status] = tours.filter(t => t.statut === status).length;
    });
    return counts;
  }, [tours]);

  const stats = useMemo(() => [
    {
      label: "Total Tours",
      value: tours.length,
      icon: TruckIcon,
      color: "bg-blue-500",
    },
    {
      label: "En cours",
      value: tours.filter(t => ['EN_TOURNEE', 'PRET_A_PARTIR', 'RETOUR'].includes(t.statut)).length,
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

  // Filter tours based on selected status and matricule search
  const filteredTours = useMemo(() => {
    let filtered = tours;
    
    // Filter by status
    if (selectedStatus !== "ALL") {
      filtered = filtered.filter(t => t.statut === selectedStatus);
    }
    
    // Filter by matricule search
    if (matriculeSearch.trim()) {
      const searchDigits = matriculeSearch.replace(/[^0-9]/g, '');
      if (searchDigits) {
        filtered = filtered.filter(t => {
          const tourDigits = t.matricule_vehicule.replace(/[^0-9]/g, '');
          return tourDigits.includes(searchDigits);
        });
      }
    }
    
    return filtered;
  }, [tours, selectedStatus, matriculeSearch]);

  const statusFilters = [
    { key: "ALL" as const, label: "Tous", icon: TruckIcon, badgeColor: "bg-slate-500" },
    ...STATUS_ORDER.map((key) => ({
      key,
      label: statusConfig[key]?.label ?? key,
      icon: statusConfig[key]?.icon ?? Package,
      badgeColor: statusConfig[key]?.badgeColor ?? "bg-gray-500",
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

      {/* Filters Section */}
      <Card className="border-none shadow-md dark:bg-gray-800/50 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Matricule Search */}
          <div className="flex items-center gap-2 shrink-0">
            <Search className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <MatriculeInput
              value={matriculeSearch}
              onChange={setMatriculeSearch}
              placeholder="Rechercher..."
            />
            {matriculeSearch && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMatriculeSearch("")}
                className="h-10 w-10 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
          
          {/* Separator */}
          <div className="hidden lg:block w-px h-10 bg-gray-300 dark:bg-gray-600" />
          
          {/* Status Filter Bar */}
          <div className="flex flex-wrap gap-2 flex-1">
          {statusFilters.map((filter) => {
            const isActive = selectedStatus === filter.key;
            const Icon = filter.icon;
            const count = statusCounts[filter.key] || 0;

            return (
              <button
                key={filter.key}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive 
                    ? `${filter.badgeColor} text-white shadow-lg ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-${filter.badgeColor.replace('bg-', '')}/50` 
                    : 'bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600/50 hover:shadow-sm'
                }`}
                onClick={() => setSelectedStatus(filter.key as StatusKey | "ALL")}
              >
                <Icon className="h-4 w-4" />
                <span>{filter.label}</span>
                <span 
                  className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive 
                      ? 'bg-white/25 text-white' 
                      : `${filter.badgeColor} text-white`
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
          </div>
        </div>
      </Card>

      {/* Tours Table */}
      <Card className="border-none shadow-lg dark:bg-gray-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TruckIcon className="h-5 w-5" />
            Liste des Tournées
            <Badge variant="secondary" className="ml-2">
              {filteredTours.length} tournée{filteredTours.length > 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            {selectedStatus === "ALL" && !matriculeSearch
              ? "Toutes les tournées" 
              : selectedStatus === "ALL"
              ? `Recherche: ${matriculeSearch}`
              : matriculeSearch
              ? `${statusConfig[selectedStatus]?.label} • Recherche: ${matriculeSearch}`
              : `Tournées en statut: ${statusConfig[selectedStatus]?.label}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTours.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucune tournée trouvée</p>
              <p className="text-sm mt-1">
                {selectedStatus === "ALL" 
                  ? "Il n'y a pas encore de tournées" 
                  : "Aucune tournée avec ce statut"
                }
              </p>
            </div>
          ) : (
            <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/80">
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Matricule</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Chauffeur</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Secteur</TableHead>
                    <TableHead className="font-semibold text-center text-gray-700 dark:text-gray-200">Caisses Départ</TableHead>
                    <TableHead className="font-semibold text-center text-gray-700 dark:text-gray-200">Caisses Retour</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Statut</TableHead>
                    <TableHead className="font-semibold text-center text-gray-700 dark:text-gray-200">Conflits</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Date</TableHead>
                    <TableHead className="font-semibold text-center text-gray-700 dark:text-gray-200">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTours.map((tour) => {
                    const config = statusConfig[tour.statut];
                    const Icon = config?.icon ?? Package;
                    const difference = tour.nbre_caisses_retour !== null 
                      ? tour.nbre_caisses_depart - tour.nbre_caisses_retour 
                      : null;

                    return (
                      <TableRow key={tour.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:border-gray-700">
                        <TableCell>
                          <MatriculeDisplay
                            matricule={tour.matricule_vehicule}
                            size="sm"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <span className="font-medium text-gray-900 dark:text-gray-100">{tour.driver?.nom_complet || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <span className="text-gray-700 dark:text-gray-300">{tour.secteur?.nom || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-mono dark:border-gray-600 dark:text-gray-200">
                            {tour.nbre_caisses_depart}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {tour.nbre_caisses_retour !== null ? (
                            <div className="flex items-center justify-center gap-2">
                              <Badge variant="outline" className="font-mono dark:border-gray-600 dark:text-gray-200">
                                {tour.nbre_caisses_retour}
                              </Badge>
                              {difference !== null && difference > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  -{difference}
                                </Badge>
                              )}
                              {difference !== null && difference < 0 && (
                                <Badge className="bg-purple-500 text-white text-xs">
                                  +{Math.abs(difference)}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${config?.bgColor} ${config?.color} border-none`}>
                            <Icon className="h-3 w-3 mr-1" />
                            {config?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {tour.conflicts.length > 0 ? (
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {tour.conflicts.length}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-300 dark:text-green-400 dark:border-green-700">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              0
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(tour.createdAt), "dd MMM yyyy", { locale: fr })}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" className="dark:text-gray-300 dark:hover:bg-gray-700" asChild>
                            <Link href={`/dashboard/tours/${tour.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              Voir
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
