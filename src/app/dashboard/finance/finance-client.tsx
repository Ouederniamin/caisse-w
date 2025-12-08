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
import {
  Package,
  Scale,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  };
  tours_total: number;
  tours_terminees: number;
}

interface Conflict {
  id: string;
  statut: string;
  quantite_perdue: number;
  montant_dette_tnd: number | null;
  createdAt: Date;
  tour: {
    driver: {
      id: string;
      nom_complet: string;
    };
  };
}

interface FinanceClientProps {
  summary: FinanceSummary;
  conflicts: Conflict[];
}

export function FinanceClient({ summary, conflicts }: FinanceClientProps) {
  const periodLabel = useMemo(() => {
    const start = new Date(summary.periode.debut);
    return format(start, "MMMM yyyy", { locale: fr });
  }, [summary.periode.debut]);

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    EN_ATTENTE: { label: "En attente", variant: "secondary" },
    PAYEE: { label: "Payée", variant: "default" },
    ANNULE: { label: "Annulée", variant: "outline" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Module Finance</h2>
          <p className="text-muted-foreground">
            Résumé financier pour {periodLabel}
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <BarChart3 className="w-4 h-4 mr-2" />
          {summary.tours_total} tournées
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Caisses Livrées */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Caisses Livrées</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.caisses.livrees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {summary.caisses.retournees.toLocaleString()} retournées
            </p>
          </CardContent>
        </Card>

        {/* Caisses Perdues */}
        <Card className={summary.caisses.perdues > 0 ? "border-orange-200 dark:border-orange-800" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Caisses Perdues</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summary.caisses.perdues.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Taux de perte: {summary.caisses.taux_perte}%
            </p>
          </CardContent>
        </Card>

        {/* Kilos Livrés */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kilos Livrés</CardTitle>
            <Scale className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.kilos.livres.toLocaleString()} kg</div>
            <p className="text-xs text-muted-foreground">
              Départ: {summary.kilos.depart.toLocaleString()} kg
            </p>
          </CardContent>
        </Card>

        {/* Conflits */}
        <Card className={summary.conflits.en_attente > 0 ? "border-red-200 dark:border-red-800" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conflits</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.conflits.total}</div>
            <div className="flex gap-2 text-xs">
              <span className="text-orange-600">{summary.conflits.en_attente} en attente</span>
              <span className="text-green-600">{summary.conflits.payes} payés</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Summary Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Conflits en attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{summary.conflits.en_attente}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Nécessitent une action
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Conflits résolus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{summary.conflits.payes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Payés ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Taux de résolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {summary.conflits.total > 0 
                ? Math.round((summary.conflits.payes / summary.conflits.total) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.tours_terminees}/{summary.tours_total} tournées terminées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conflicts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Conflits du mois</CardTitle>
          <CardDescription>
            Liste des conflits détectés pour {periodLabel}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conflicts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun conflit ce mois-ci</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Chauffeur</TableHead>
                    <TableHead className="text-right">Quantité perdue</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conflicts.map((conflict) => (
                    <TableRow key={conflict.id}>
                      <TableCell>
                        {format(new Date(conflict.createdAt), "dd/MM/yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {conflict.tour.driver.nom_complet}
                      </TableCell>
                      <TableCell className="text-right">
                        {conflict.quantite_perdue} caisses
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[conflict.statut]?.variant || "secondary"}>
                          {statusConfig[conflict.statut]?.label || conflict.statut}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
