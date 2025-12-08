"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  UserCog,
  Shield,
  Calendar,
  TruckIcon,
  AlertTriangle,
  ArrowLeft,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import MatriculeDisplay from "@/components/MatriculeDisplay";

interface Driver {
  id: string;
  nom_complet: string;
  matricule_par_defaut: string | null;
  tolerance_caisses_mensuelle: number;
  createdAt: Date;
  updatedAt: Date;
  tours: {
    id: string;
    statut: string;
    createdAt: Date;
    secteur: {
      nom: string;
    } | null;
    _count: {
      conflicts: number;
    };
  }[];
}

interface DriverDetailClientProps {
  driver: Driver;
}

export function DriverDetailClient({ driver }: DriverDetailClientProps) {
  const formatMatricule = (raw: string | null | undefined): string | null => {
    if (!raw) return null;
    const cleaned = raw.replace(/تونس/g, "");
    const digits = cleaned.replace(/[^0-9]/g, "");
    if (digits.length < 7) return raw;
    const first = digits.slice(0, 3);
    const last = digits.slice(-4);
    const LRM = '\u200E';
    return `${LRM}${first} ${LRM}تونس ${LRM}${last}${LRM}`;
  };
  const statusConfig = useMemo(
    () => ({
      PREPARATION: { label: "Préparation", color: "bg-gray-500", icon: Package },
      PRET_A_PARTIR: { label: "Prêt à partir", color: "bg-blue-500", icon: CheckCircle2 },
      EN_TOURNEE: { label: "En tournée", color: "bg-green-500", icon: TruckIcon },
      EN_ATTENTE_DECHARGEMENT: { label: "En attente déchargement", color: "bg-orange-500", icon: Clock },
      EN_ATTENTE_HYGIENE: { label: "En attente hygiène", color: "bg-purple-500", icon: Clock },
      TERMINEE: { label: "Terminée", color: "bg-emerald-500", icon: CheckCircle2 },
    }),
    []
  );

  const stats = useMemo(() => {
    const totalTours = driver.tours.length;
    const activeTours = driver.tours.filter((t) =>
      ["PRET_A_PARTIR", "EN_TOURNEE", "EN_ATTENTE_DECHARGEMENT", "EN_ATTENTE_HYGIENE"].includes(
        t.statut
      )
    ).length;
    const completedTours = driver.tours.filter((t) => t.statut === "TERMINEE").length;
    const totalConflicts = driver.tours.reduce((sum, t) => sum + t._count.conflicts, 0);

    return [
      {
        label: "Total Tournées",
        value: totalTours,
        icon: TruckIcon,
        color: "bg-blue-500",
      },
      {
        label: "Tournées Actives",
        value: activeTours,
        icon: Clock,
        color: "bg-green-500",
      },
      {
        label: "Tournées Terminées",
        value: completedTours,
        icon: CheckCircle2,
        color: "bg-emerald-500",
      },
      {
        label: "Total Conflits",
        value: totalConflicts,
        icon: AlertTriangle,
        color: "bg-orange-500",
      },
    ];
  }, [driver.tours]);

  const recentTours = useMemo(() => driver.tours.slice(0, 20), [driver.tours]);

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/chauffeurs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{driver.nom_complet}</h1>
          <p className="text-muted-foreground">Détails du chauffeur</p>
        </div>
      </div>

      {/* Driver Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Informations du Chauffeur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Nom Complet</p>
              <p className="font-medium">{driver.nom_complet}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Matricule</p>
              {driver.matricule_par_defaut ? (
                <MatriculeDisplay
                  matricule={driver.matricule_par_defaut}
                  size="sm"
                />
              ) : (
                <p className="text-sm text-muted-foreground">Non défini</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Tolérance Mensuelle</p>
              <Badge variant="secondary">
                <Shield className="h-3 w-3 mr-1" />
                {driver.tolerance_caisses_mensuelle} caisses
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Date d'ajout</p>
              <p className="text-sm flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(driver.createdAt), "dd MMMM yyyy", { locale: fr })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tours List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TruckIcon className="h-5 w-5" />
            Historique des Tournées
          </CardTitle>
          <CardDescription>
            {recentTours.length > 0
              ? `${recentTours.length} dernière(s) tournée(s)`
              : "Aucune tournée"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTours.length === 0 ? (
            <div className="text-center py-12">
              <TruckIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Ce chauffeur n'a pas encore de tournées
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Secteur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Conflits</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTours.map((tour) => {
                    const statusInfo = statusConfig[tour.statut as keyof typeof statusConfig];
                    const StatusIcon = statusInfo?.icon || Package;
                    return (
                      <TableRow key={tour.id}>
                        <TableCell className="text-sm">
                          {format(new Date(tour.createdAt), "dd MMM yyyy HH:mm", {
                            locale: fr,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{tour.secteur?.nom || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${statusInfo?.color || "bg-gray-500"} text-white border-0`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo?.label || tour.statut}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {tour._count.conflicts > 0 ? (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {tour._count.conflicts}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Aucun
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/tours/${tour.id}`}>
                              Détails
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
