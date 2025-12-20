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
import { 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  TruckIcon, 
  User, 
  Calendar, 
  Eye, 
  Search, 
  X,
  AlertTriangle,
  MapPin
} from "lucide-react";
import MatriculeDisplay from "@/components/MatriculeDisplay";
import MatriculeInput from "@/components/MatriculeInput";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUS_ORDER = [
  "EN_ATTENTE",
  "RESOLUE",
  "PAYEE",
  "ANNULE",
] as const;

type StatusKey = (typeof STATUS_ORDER)[number];

type Conflict = {
  id: string;
  tourId: string;
  quantite_perdue: number;
  montant_dette_tnd: number;
  statut: StatusKey;
  notes_direction: string | null;
  depasse_tolerance: boolean;
  createdAt: string | Date;
  tour: {
    matricule_vehicule: string;
    driver: { nom_complet: string; tolerance_caisses_mensuelle: number } | null;
    secteur: { nom: string } | null;
    agentControle: { name: string | null } | null;
  };
};

interface ConflitsClientProps {
  conflicts: Conflict[];
}

export function ConflitsClient({ conflicts }: ConflitsClientProps) {
  const [selectedStatus, setSelectedStatus] = useState<StatusKey | "ALL">("ALL");
  const [matriculeSearch, setMatriculeSearch] = useState("");

  const statusConfig = useMemo(() => ({
    EN_ATTENTE: {
      label: "En attente",
      color: "text-orange-700 dark:text-orange-300",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      badgeColor: "bg-orange-500",
      icon: Clock,
    },
    PAYEE: {
      label: "Payée",
      color: "text-green-700 dark:text-green-300",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      badgeColor: "bg-green-500",
      icon: CheckCircle,
    },
    ANNULE: {
      label: "Annulé",
      color: "text-red-700 dark:text-red-300",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      badgeColor: "bg-red-500",
      icon: XCircle,
    },
    RESOLUE: {
      label: "Résolu",
      color: "text-green-700 dark:text-green-300",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      badgeColor: "bg-green-500",
      icon: CheckCircle,
    },
  }), []);

  // Count conflicts by status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: conflicts.length };
    STATUS_ORDER.forEach(status => {
      counts[status] = conflicts.filter(c => c.statut === status).length;
    });
    return counts;
  }, [conflicts]);

  // Calculate stats
  const stats = useMemo(() => {
    const pendingConflicts = conflicts.filter(c => c.statut === 'EN_ATTENTE');
    const totalPerte = conflicts.reduce((sum, c) => sum + c.quantite_perdue, 0);
    const totalMontant = conflicts.reduce((sum, c) => sum + c.montant_dette_tnd, 0);
    const conflitsDepasses = conflicts.filter(c => c.depasse_tolerance).length;

    return [
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
        value: `${totalMontant.toFixed(2)} TND`,
        icon: DollarSign,
        color: "bg-blue-500",
      },
    ];
  }, [conflicts]);

  // Filter conflicts based on selected status and matricule search
  const filteredConflicts = useMemo(() => {
    let filtered = conflicts;
    
    // Filter by status
    if (selectedStatus !== "ALL") {
      filtered = filtered.filter(c => c.statut === selectedStatus);
    }
    
    // Filter by matricule search
    if (matriculeSearch.trim()) {
      const searchDigits = matriculeSearch.replace(/[^0-9]/g, '');
      if (searchDigits) {
        filtered = filtered.filter(c => {
          const tourDigits = c.tour.matricule_vehicule.replace(/[^0-9]/g, '');
          return tourDigits.includes(searchDigits);
        });
      }
    }
    
    return filtered;
  }, [conflicts, selectedStatus, matriculeSearch]);

  const statusFilters = [
    { key: "ALL" as const, label: "Tous", icon: AlertCircle, badgeColor: "bg-slate-500" },
    ...STATUS_ORDER.map((key) => ({
      key,
      label: statusConfig[key]?.label ?? key,
      icon: statusConfig[key]?.icon ?? AlertCircle,
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

      {/* Conflicts Table */}
      <Card className="border-none shadow-lg dark:bg-gray-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Liste des Conflits
            <Badge variant="secondary" className="ml-2">
              {filteredConflicts.length} conflit{filteredConflicts.length > 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            {selectedStatus === "ALL" && !matriculeSearch
              ? "Tous les conflits" 
              : selectedStatus === "ALL"
              ? `Recherche: ${matriculeSearch}`
              : matriculeSearch
              ? `${statusConfig[selectedStatus]?.label} • Recherche: ${matriculeSearch}`
              : `Conflits en statut: ${statusConfig[selectedStatus]?.label}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredConflicts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucun conflit trouvé</p>
              <p className="text-sm mt-1">
                {selectedStatus === "ALL" 
                  ? "Toutes les livraisons se déroulent sans incident" 
                  : "Aucun conflit avec ce statut"
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
                    <TableHead className="font-semibold text-center text-gray-700 dark:text-gray-200">Perte</TableHead>
                    <TableHead className="font-semibold text-center text-gray-700 dark:text-gray-200">Montant</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Statut</TableHead>
                    <TableHead className="font-semibold text-center text-gray-700 dark:text-gray-200">Tolérance</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Date</TableHead>
                    <TableHead className="font-semibold text-center text-gray-700 dark:text-gray-200">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConflicts.map((conflict) => {
                    const config = statusConfig[conflict.statut];
                    const Icon = config?.icon ?? AlertCircle;

                    return (
                      <TableRow key={conflict.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:border-gray-700">
                        <TableCell>
                          <MatriculeDisplay
                            matricule={conflict.tour.matricule_vehicule}
                            size="sm"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {conflict.tour.driver?.nom_complet || "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {conflict.tour.secteur?.nom || "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="destructive" className="font-mono">
                            -{conflict.quantite_perdue}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-mono text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-700">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {conflict.montant_dette_tnd.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${config?.bgColor} ${config?.color} border-none`}>
                            <Icon className="h-3 w-3 mr-1" />
                            {config?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {conflict.depasse_tolerance ? (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Dépassée
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-300 dark:text-green-400 dark:border-green-700 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              OK
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(conflict.createdAt), "dd MMM yyyy", { locale: fr })}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" className="dark:text-gray-300 dark:hover:bg-gray-700" asChild>
                            <Link href={`/dashboard/conflits/${conflict.id}`}>
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
