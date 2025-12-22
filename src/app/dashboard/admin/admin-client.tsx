"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TruckIcon,
  Package,
  AlertCircle,
  CheckCircle,
  Users,
  DollarSign,
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";

type AdminStats = {
  totalTours: number;
  activeTours: number;
  completedTours: number;
  totalConflicts: number;
  pendingConflicts: number;
  paidConflicts: number;
  totalDebt: number;
  totalDrivers: number;
  totalUsers: number;
  totalCaissesDeparture: number;
  totalCaissesReturned: number;
  avgCaissesPerTour: number;
  toursByStatus: { status: string; count: number; color: string }[];
  conflictsByStatus: { status: string; count: number }[];
  toursOverTime: { date: string; count: number }[];
  conflictTrend: { date: string; amount: number }[];
  topDrivers: { name: string; tours: number; conflicts: number }[];
  sectorPerformance: { sector: string; tours: number; conflicts: number; conflictRate: number }[];
};

interface AdminClientProps {
  stats: AdminStats;
}

const COLORS = {
  blue: "#3b82f6",
  green: "#10b981",
  red: "#ef4444",
  yellow: "#f59e0b",
  purple: "#8b5cf6",
  orange: "#f97316",
  gray: "#6b7280",
  amber: "#f59e0b",
  violet: "#7c3aed",
  teal: "#14b8a6",
};

export function AdminClient({ stats }: AdminClientProps) {
  const statusConfig = useMemo(
    () => ({
      PESEE_VIDE: { label: "Pesée à vide", color: COLORS.gray },
      EN_CHARGEMENT: { label: "En chargement", color: COLORS.amber },
      PRET_A_PARTIR: { label: "Prêt à partir", color: COLORS.blue },
      EN_TOURNEE: { label: "En tournée", color: COLORS.purple },
      RETOUR: { label: "Retour usine", color: COLORS.violet },
      EN_ATTENTE_DECHARGEMENT: { label: "Déchargé", color: COLORS.teal },
      EN_ATTENTE_HYGIENE: { label: "Attente hygiène", color: COLORS.yellow },
      TERMINEE: { label: "Terminée", color: COLORS.green },
    }),
    []
  );

  const caissesLossRate =
    stats.totalCaissesDeparture > 0
      ? (((stats.totalCaissesDeparture - stats.totalCaissesReturned) / stats.totalCaissesDeparture) * 100).toFixed(1)
      : 0;

  const conflictRate = stats.totalTours > 0 ? ((stats.totalConflicts / stats.totalTours) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tours</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalTours}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-blue-600 dark:text-blue-400">{stats.activeTours} actifs</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-500">
                <TruckIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Conflits</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalConflicts}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-orange-600 dark:text-orange-400">{stats.pendingConflicts} en attente</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-red-500">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Dette Totale</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalDebt.toFixed(0)} TND</p>
                <div className="flex items-center gap-1 mt-2">
                  {stats.totalDebt > 5000 ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  )}
                  <span className={`text-sm ${stats.totalDebt > 5000 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {conflictRate}% taux
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-yellow-500">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Utilisateurs</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalUsers}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TruckIcon className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-purple-600 dark:text-purple-400">{stats.totalDrivers} chauffeurs</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-purple-500">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tours Terminés</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.completedTours}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Caisses Départ</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalCaissesDeparture}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Caisses Retour</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalCaissesReturned}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Taux de Perte</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{caissesLossRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Tours Distribution & Conflict Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tours by Status - Pie Chart */}
        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Répartition des Tours
            </CardTitle>
            <CardDescription className="dark:text-gray-400">Distribution par statut</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.toursByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {stats.toursByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conflict Trend - Area Chart */}
        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
              Évolution des Conflits
            </CardTitle>
            <CardDescription className="dark:text-gray-400">Dette par jour (TND)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.conflictTrend}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.red} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={COLORS.red} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Area type="monotone" dataKey="amount" stroke={COLORS.red} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Tours Over Time & Sector Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tours Over Time - Line Chart */}
        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Activité des Tours
            </CardTitle>
            <CardDescription className="dark:text-gray-400">Nombre de tours par jour</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.toursOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Line type="monotone" dataKey="count" stroke={COLORS.purple} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sector Performance - Bar Chart */}
        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
              Performance par Secteur
            </CardTitle>
            <CardDescription className="dark:text-gray-400">Tours et conflits par secteur</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.sectorPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="sector" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Bar dataKey="tours" fill={COLORS.green} name="Tours" />
                <Bar dataKey="conflicts" fill={COLORS.red} name="Conflits" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Drivers & Sector Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Drivers */}
        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Top Chauffeurs
            </CardTitle>
            <CardDescription className="dark:text-gray-400">Classement par nombre de tours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topDrivers.map((driver, index) => (
                <div key={driver.name} className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-orange-600" : "bg-gray-500"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{driver.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{driver.tours} tours</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {driver.conflicts > 0 ? (
                      <Badge variant="destructive" className="text-xs">
                        {driver.conflicts} conflit{driver.conflicts > 1 ? "s" : ""}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                        Aucun conflit
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sector Rankings */}
        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
              Secteurs - Taux de Conflit
            </CardTitle>
            <CardDescription className="dark:text-gray-400">Pourcentage de conflits par secteur</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.sectorPerformance.map((sector) => (
                <div key={sector.sector} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{sector.sector}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {sector.tours} tours • {sector.conflicts} conflits
                      </p>
                    </div>
                    <Badge
                      variant={sector.conflictRate > 15 ? "destructive" : sector.conflictRate > 8 ? "default" : "outline"}
                      className={
                        sector.conflictRate <= 8
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
                          : ""
                      }
                    >
                      {sector.conflictRate.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        sector.conflictRate > 15
                          ? "bg-red-500"
                          : sector.conflictRate > 8
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(sector.conflictRate * 5, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
