"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  Scale,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Clock,
  BarChart3,
  DollarSign,
  Users,
  MapPin,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import MatriculeDisplay from "@/components/MatriculeDisplay";

interface FinanceSummary {
  periode: {
    debut: string;
    fin: string;
  };
  caisses: {
    livrees: number;
    retournees: number;
    perdues: number;
    taux_perte: number;
    taux_perte_mois_dernier: number;
  };
  kilos: {
    depart: number;
    retour: number;
    livres: number;
  };
  conflits: {
    total: number;
    en_attente: number;
    payes: number;
    annules: number;
    depasse_tolerance: number;
  };
  dette: {
    total_en_attente: number;
    total_payee: number;
    total_annulee: number;
    ce_mois: number;
  };
  tours_total: number;
  tours_terminees: number;
}

interface Conflict {
  id: string;
  statut: string;
  quantite_perdue: number;
  montant_dette_tnd: number;
  depasse_tolerance: boolean;
  createdAt: Date | string;
  tour: {
    matricule_vehicule: string;
    driver: {
      id: string;
      nom_complet: string;
    } | null;
    secteur: {
      id: string;
      nom: string;
    } | null;
  };
}

interface DriverDebt {
  name: string;
  debt: number;
  caisses: number;
  conflicts: number;
}

interface SecteurStat {
  name: string;
  tours: number;
  caisses: number;
  lost: number;
}

interface DailyStat {
  date: string;
  tours: number;
  caisses: number;
  lost: number;
}

interface FinanceClientProps {
  summary: FinanceSummary;
  conflicts: Conflict[];
  driverDebts: DriverDebt[];
  secteurStats: SecteurStat[];
  dailyStats: DailyStat[];
}

export function FinanceClient({ 
  summary, 
  conflicts, 
  driverDebts, 
  secteurStats,
  dailyStats 
}: FinanceClientProps) {
  const periodLabel = useMemo(() => {
    const start = new Date(summary.periode.debut);
    return format(start, "MMMM yyyy", { locale: fr });
  }, [summary.periode.debut]);

  const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    EN_ATTENTE: { label: "En attente", color: "text-orange-700 dark:text-orange-300", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
    PAYEE: { label: "Payée", color: "text-green-700 dark:text-green-300", bgColor: "bg-green-100 dark:bg-green-900/30" },
    ANNULE: { label: "Annulée", color: "text-red-700 dark:text-red-300", bgColor: "bg-red-100 dark:bg-red-900/30" },
  };

  // Calculate trend (comparing to last month)
  const tauxPerteTrend = summary.caisses.taux_perte - summary.caisses.taux_perte_mois_dernier;
  const isPerteWorse = tauxPerteTrend > 0;

  // Calculate max values for progress bars
  const maxDailyTours = Math.max(...dailyStats.map(d => d.tours), 1);
  const maxDriverDebt = Math.max(...driverDebts.map(d => d.debt), 1);

  return (
    <ScrollArea className="h-[calc(100vh-120px)]">
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Module Finance
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Résumé financier pour <span className="font-semibold capitalize">{periodLabel}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-lg px-4 py-2">
              <BarChart3 className="w-4 h-4 mr-2" />
              {summary.tours_total} tournées
            </Badge>
            <Badge 
              variant="outline" 
              className={`text-lg px-4 py-2 ${
                summary.conflits.en_attente > 0 
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400' 
                  : 'border-green-500 text-green-600 dark:text-green-400'
              }`}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              {summary.conflits.en_attente} en attente
            </Badge>
          </div>
        </div>

        {/* Debt Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Debt Pending */}
          <Card className="border-none shadow-lg dark:bg-gray-800/50 border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Dette en Attente
              </CardTitle>
              <div className="p-2 rounded-lg bg-orange-500">
                <Wallet className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {summary.dette.total_en_attente.toLocaleString()} <span className="text-lg">TND</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                À recouvrer
              </p>
            </CardContent>
          </Card>

          {/* Total Debt Collected */}
          <Card className="border-none shadow-lg dark:bg-gray-800/50 border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Dette Recouvrée
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-500">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {summary.dette.total_payee.toLocaleString()} <span className="text-lg">TND</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Total payé
              </p>
            </CardContent>
          </Card>

          {/* This Month Debt */}
          <Card className="border-none shadow-lg dark:bg-gray-800/50 border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Dette ce Mois
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-500">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {summary.dette.ce_mois.toLocaleString()} <span className="text-lg">TND</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {summary.conflits.total} conflits
              </p>
            </CardContent>
          </Card>

          {/* Cancelled Debt */}
          <Card className="border-none shadow-lg dark:bg-gray-800/50 border-l-4 border-l-gray-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Dette Annulée
              </CardTitle>
              <div className="p-2 rounded-lg bg-gray-500">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                {summary.dette.total_annulee.toLocaleString()} <span className="text-lg">TND</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Non recouvrée
              </p>
            </CardContent>
          </Card>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Caisses Livrées */}
          <Card className="border-none shadow-lg dark:bg-gray-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Caisses Départ
              </CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.caisses.livrees.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {summary.caisses.retournees.toLocaleString()} retournées
              </p>
            </CardContent>
          </Card>

          {/* Caisses Perdues */}
          <Card className={`border-none shadow-lg dark:bg-gray-800/50 ${summary.caisses.perdues > 0 ? "ring-1 ring-orange-200 dark:ring-orange-800" : ""}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Caisses Perdues
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {summary.caisses.perdues.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Taux: {summary.caisses.taux_perte}%
                </span>
                {tauxPerteTrend !== 0 && (
                  <span className={`flex items-center text-xs ${isPerteWorse ? 'text-red-500' : 'text-green-500'}`}>
                    {isPerteWorse ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(tauxPerteTrend).toFixed(1)}%
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Kilos Livrés */}
          <Card className="border-none shadow-lg dark:bg-gray-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Kilos Livrés
              </CardTitle>
              <Scale className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.kilos.livres.toLocaleString()} <span className="text-sm text-gray-500">kg</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Départ: {summary.kilos.depart.toLocaleString()} kg
              </p>
            </CardContent>
          </Card>

          {/* Tours Terminées */}
          <Card className="border-none shadow-lg dark:bg-gray-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tournées Terminées
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.tours_terminees} / {summary.tours_total}
              </div>
              <Progress 
                value={(summary.tours_terminees / Math.max(summary.tours_total, 1)) * 100} 
                className="mt-2 h-2"
              />
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Driver Debts */}
          <Card className="border-none shadow-lg dark:bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Dettes par Chauffeur
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Top 10 chauffeurs avec dettes en attente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {driverDebts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Aucune dette en attente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {driverDebts.map((driver, index) => (
                    <div key={driver.name} className="flex items-center gap-4">
                      <div className="w-6 text-center">
                        <span className={`text-sm font-bold ${
                          index === 0 ? 'text-red-500' : 
                          index === 1 ? 'text-orange-500' : 
                          index === 2 ? 'text-yellow-500' : 
                          'text-gray-400'
                        }`}>
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900 dark:text-white truncate">
                            {driver.name}
                          </span>
                          <span className="font-bold text-orange-600 dark:text-orange-400">
                            {driver.debt.toFixed(2)} TND
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{driver.conflicts} conflit(s) • {driver.caisses} caisses</span>
                        </div>
                        <Progress 
                          value={(driver.debt / maxDriverDebt) * 100} 
                          className="mt-2 h-1.5"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Secteur Performance */}
          <Card className="border-none shadow-lg dark:bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Performance par Secteur
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Statistiques des tournées par zone
              </CardDescription>
            </CardHeader>
            <CardContent>
              {secteurStats.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Aucune donnée de secteur</p>
                </div>
              ) : (
                <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800/80">
                        <TableHead className="font-semibold dark:text-gray-200">Secteur</TableHead>
                        <TableHead className="text-center font-semibold dark:text-gray-200">Tours</TableHead>
                        <TableHead className="text-center font-semibold dark:text-gray-200">Caisses</TableHead>
                        <TableHead className="text-center font-semibold dark:text-gray-200">Perdues</TableHead>
                        <TableHead className="text-center font-semibold dark:text-gray-200">Taux</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {secteurStats.slice(0, 8).map((secteur) => {
                        const tauxPerte = secteur.caisses > 0 
                          ? ((secteur.lost / secteur.caisses) * 100).toFixed(1) 
                          : "0.0";
                        return (
                          <TableRow key={secteur.name} className="dark:border-gray-700">
                            <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                              {secteur.name}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{secteur.tours}</Badge>
                            </TableCell>
                            <TableCell className="text-center text-gray-700 dark:text-gray-300">
                              {secteur.caisses}
                            </TableCell>
                            <TableCell className="text-center">
                              {secteur.lost > 0 ? (
                                <Badge variant="destructive">-{secteur.lost}</Badge>
                              ) : (
                                <span className="text-green-600">0</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={parseFloat(tauxPerte) > 5 ? 'text-red-500 font-bold' : 'text-gray-600 dark:text-gray-400'}>
                                {tauxPerte}%
                              </span>
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

        {/* Daily Activity Chart (Simple) */}
        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Activité Journalière
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Nombre de tournées par jour ce mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-40 overflow-x-auto pb-6">
              {dailyStats.map((day, index) => {
                const dayNumber = new Date(day.date).getDate();
                const isToday = new Date(day.date).toDateString() === new Date().toDateString();
                const barHeight = maxDailyTours > 0 
                  ? Math.max((day.tours / maxDailyTours) * 120, day.tours > 0 ? 20 : 8) 
                  : 8;
                
                return (
                  <div 
                    key={index}
                    className="flex flex-col items-center gap-1 min-w-5"
                  >
                    <span className="text-[9px] text-gray-500 dark:text-gray-400 mb-1">
                      {day.tours > 0 ? day.tours : ''}
                    </span>
                    <div 
                      className={`w-5 rounded-t transition-all ${
                        isToday 
                          ? 'bg-blue-500' 
                          : day.tours > 0 
                            ? 'bg-blue-400 dark:bg-blue-600' 
                            : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                      style={{ height: `${barHeight}px` }}
                      title={`${dayNumber}/${new Date(day.date).getMonth() + 1}: ${day.tours} tournée(s)`}
                    />
                    <span className={`text-[10px] ${isToday ? 'text-blue-500 font-bold' : 'text-gray-400'}`}>
                      {dayNumber}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Conflicts Table */}
        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Conflits du Mois
                  <Badge variant="secondary" className="ml-2">
                    {conflicts.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Liste des conflits détectés pour {periodLabel}
                </CardDescription>
              </div>
              <Button variant="outline" asChild>
                <Link href="/dashboard/conflits">
                  Voir tous
                  <Eye className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {conflicts.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white">Aucun conflit ce mois-ci</p>
                <p className="text-gray-500 dark:text-gray-400">Toutes les livraisons se déroulent sans incident</p>
              </div>
            ) : (
              <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800/80">
                      <TableHead className="font-semibold dark:text-gray-200">Date</TableHead>
                      <TableHead className="font-semibold dark:text-gray-200">Matricule</TableHead>
                      <TableHead className="font-semibold dark:text-gray-200">Chauffeur</TableHead>
                      <TableHead className="font-semibold dark:text-gray-200">Secteur</TableHead>
                      <TableHead className="text-center font-semibold dark:text-gray-200">Perte</TableHead>
                      <TableHead className="text-center font-semibold dark:text-gray-200">Montant</TableHead>
                      <TableHead className="font-semibold dark:text-gray-200">Statut</TableHead>
                      <TableHead className="text-center font-semibold dark:text-gray-200">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conflicts.slice(0, 10).map((conflict) => (
                      <TableRow key={conflict.id} className="dark:border-gray-700">
                        <TableCell className="text-gray-700 dark:text-gray-300">
                          {format(new Date(conflict.createdAt), "dd/MM/yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <MatriculeDisplay 
                            matricule={conflict.tour.matricule_vehicule}
                            size="sm"
                          />
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                          {conflict.tour.driver?.nom_complet || "N/A"}
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300">
                          {conflict.tour.secteur?.nom || "N/A"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="destructive">-{conflict.quantite_perdue}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-mono">
                            {conflict.montant_dette_tnd.toFixed(2)} TND
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusConfig[conflict.statut]?.bgColor} ${statusConfig[conflict.statut]?.color} border-none`}>
                            {conflict.statut === "EN_ATTENTE" && <Clock className="h-3 w-3 mr-1" />}
                            {conflict.statut === "PAYEE" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {statusConfig[conflict.statut]?.label || conflict.statut}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/conflits/${conflict.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
