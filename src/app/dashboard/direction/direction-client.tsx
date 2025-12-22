"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TruckIcon,
  AlertTriangle,
  Package,
  Users,
  MapPin,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
} from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";

interface DirectionClientProps {
  tours: any[];
  conflicts: any[];
  driverCount: number;
  secteurCount: number;
}

export function DirectionClient({ tours, conflicts, driverCount, secteurCount }: DirectionClientProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const yesterday = subDays(now, 1);

    const totalTours = tours.length;
    const todayTours = tours.filter((t) => new Date(t.createdAt) >= yesterday).length;
    const toursTrend = todayTours;

    const activeTours = tours.filter((t) => 
      ["PRET_A_PARTIR", "EN_TOURNEE", "EN_ATTENTE_DECHARGEMENT", "EN_ATTENTE_HYGIENE"].includes(t.statut)
    ).length;

    const pendingConflicts = conflicts.filter((c) => c.statut === "EN_ATTENTE").length;

    return [
      {
        label: "Total Tournées",
        value: totalTours,
        icon: TruckIcon,
        color: "bg-blue-500",
        trend: toursTrend,
        trendLabel: "aujourd'hui",
      },
      {
        label: "Tournées Actives",
        value: activeTours,
        icon: Activity,
        color: "bg-green-500",
        trend: null,
      },
      {
        label: "Conflits en Attente",
        value: pendingConflicts,
        icon: AlertTriangle,
        color: "bg-orange-500",
        trend: null,
      },
      {
        label: "Total Chauffeurs",
        value: driverCount,
        icon: Users,
        color: "bg-purple-500",
        trend: null,
      },
    ];
  }, [tours, conflicts, driverCount]);

  const statusConfig = useMemo(
    () => ({
      PESEE_VIDE: { label: "Pesée à vide", color: "#6b7280" },
      EN_CHARGEMENT: { label: "En chargement", color: "#f59e0b" },
      PRET_A_PARTIR: { label: "Prêt à partir", color: "#3b82f6" },
      EN_TOURNEE: { label: "En tournée", color: "#8b5cf6" },
      RETOUR: { label: "Retour usine", color: "#7c3aed" },
      EN_ATTENTE_DECHARGEMENT: { label: "Déchargé", color: "#14b8a6" },
      EN_ATTENTE_HYGIENE: { label: "Attente hygiène", color: "#eab308" },
      TERMINEE: { label: "Terminée", color: "#22c55e" },
    }),
    []
  );

  const statusData = useMemo(() => {
    const counts = tours.reduce((acc: any, tour) => {
      const status = tour.statut || "PESEE_VIDE";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusConfig)
      .map(([key, config]: [string, any]) => ({
        name: config.label,
        value: counts[key] || 0,
        color: config.color,
      }))
      .filter(item => item.value > 0);
  }, [tours, statusConfig]);

  const secteurData = useMemo(() => {
    const counts = tours.reduce((acc: any, tour) => {
      const secteur = tour.secteur?.nom || "Sans secteur";
      acc[secteur] = (acc[secteur] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        tournées: value,
      }))
      .sort((a: any, b: any) => b.tournées - a.tournées)
      .slice(0, 10);
  }, [tours]);

  const timelineData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return {
        date: format(date, "dd/MM", { locale: fr }),
        tournées: 0,
        conflits: 0,
      };
    });

    tours.forEach((tour) => {
      const tourDate = format(new Date(tour.createdAt), "dd/MM", { locale: fr });
      const entry = last30Days.find((d) => d.date === tourDate);
      if (entry) entry.tournées++;
    });

    conflicts.forEach((conflict) => {
      const conflictDate = format(new Date(conflict.createdAt), "dd/MM", { locale: fr });
      const entry = last30Days.find((d) => d.date === conflictDate);
      if (entry) entry.conflits++;
    });

    return last30Days;
  }, [tours, conflicts]);

  const conflictTypeData = useMemo(() => {
    const statusCounts = conflicts.reduce((acc: any, conflict) => {
      const status = conflict.statut || "EN_ATTENTE";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statusLabels: any = {
      EN_ATTENTE: "En attente",
      RESOLU: "Résolu",
      REJETE: "Rejeté",
    };

    return Object.entries(statusCounts).map(([status, value]) => ({
      name: statusLabels[status] || status,
      value,
    }));
  }, [conflicts]);

  const recentTours = useMemo(() => tours.slice(0, 5), [tours]);
  const recentConflicts = useMemo(() => conflicts.slice(0, 5), [conflicts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard Direction</h1>
        <p className="text-muted-foreground">Vue d'ensemble des opérations</p>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <a href="/dashboard/tours">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TruckIcon className="h-5 w-5 text-blue-600" />
                Gérer les Tournées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Consultez toutes les tournées et leur statut en détail
              </p>
            </CardContent>
          </a>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <a href="/dashboard/conflits">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Gérer les Conflits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Approuvez ou rejetez les conflits en attente
              </p>
            </CardContent>
          </a>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <a href="/dashboard/parametres">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" />
                Paramètres Système
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Consultez la configuration du système
              </p>
            </CardContent>
          </a>
        </Card>
      </div>

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
                {stat.trend !== null && stat.trend !== undefined && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    {stat.trend > 0 ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">+{stat.trend}</span>
                      </>
                    ) : stat.trend < 0 ? (
                      <>
                        <TrendingDown className="h-3 w-3 text-red-600" />
                        <span className="text-red-600">{stat.trend}</span>
                      </>
                    ) : (
                      <span>{stat.trend}</span>
                    )}
                    <span>{(stat as any).trendLabel || "depuis hier"}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution des Statuts</CardTitle>
            <CardDescription>Répartition des tournées par statut</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Secteur Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Tournées par Secteur</CardTitle>
            <CardDescription>Top 10 des secteurs les plus actifs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={secteurData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tournées" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Activité sur 30 jours</CardTitle>
            <CardDescription>Évolution des tournées et conflits</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="tournées" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="conflits" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conflict Types */}
        <Card>
          <CardHeader>
            <CardTitle>Statuts des Conflits</CardTitle>
            <CardDescription>Répartition par statut de conflit</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conflictTypeData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Tours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5" />
              Dernières Tournées
            </CardTitle>
            <CardDescription>Les 5 tournées les plus récentes</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {recentTours.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucune tournée</p>
                ) : (
                  recentTours.map((tour) => (
                    <div key={tour.id} className="flex items-start justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{tour.driver?.nom_complet}</p>
                          <Badge variant="outline" className="text-xs">
                            {tour.secteur?.nom}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tour.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
                        </p>
                      </div>
                      <Badge className={statusConfig[tour.statut as keyof typeof statusConfig] ? "" : "bg-gray-500"}>
                        {statusConfig[tour.statut as keyof typeof statusConfig]?.label || tour.statut}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Conflicts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Derniers Conflits
            </CardTitle>
            <CardDescription>Les 5 conflits les plus récents</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {recentConflicts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucun conflit</p>
                ) : (
                  recentConflicts.map((conflict) => (
                    <div key={conflict.id} className="flex items-start justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{conflict.tour?.driver?.nom_complet}</p>
                          {conflict.statut === "RESOLU" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : conflict.statut === "REJETE" ? (
                            <XCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-orange-600" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {conflict.notes_direction ? conflict.notes_direction.substring(0, 50) + "..." : `Quantité perdue: ${conflict.quantite_perdue} caisses`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(conflict.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
                        </p>
                      </div>
                      <Badge
                        variant={
                          conflict.statut === "EN_ATTENTE"
                            ? "default"
                            : conflict.statut === "RESOLU"
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {conflict.statut}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
