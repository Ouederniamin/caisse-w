"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  TruckIcon, 
  AlertTriangle, 
  Plus, 
  Minus,
  ShoppingCart,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  History,
  Calendar,
  CalendarDays,
  Filter,
  AlertCircle,
  Wallet,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { format, startOfDay, endOfDay, subDays, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";

interface StockCaisse {
  id: string;
  stock_initial: number;
  stock_actuel: number;
  seuil_alerte_pct: number;
  dernier_stock_ref: number;
  initialise: boolean;
  updatedAt: Date;
}

interface Mouvement {
  id: string;
  type: string;
  quantite: number;
  solde_apres: number;
  notes: string | null;
  createdAt: Date | string;
  tour: { id: string; matricule_vehicule: string } | null;
  conflict: { id: string; quantite_perdue: number } | null;
  user: { id: string; name: string | null } | null;
}

interface Perte {
  id: string;
  quantite_perdue: number;
  caisses_retournees: number;
  montant_dette_tnd: number;
  montant_paye: number;
  statut: string;
  createdAt: Date | string;
  tour: {
    id: string;
    matricule_vehicule: string;
    driver: { nom_complet: string } | null;
    secteur: { nom: string } | null;
  } | null;
}

interface StockClientProps {
  stock: StockCaisse | null;
  mouvements: Mouvement[];
  pertes: Perte[];
  stockEnTournee: number;
  stockPerdu: number;
  totalPertesPayees: number;
}

const mouvementConfig: Record<string, { label: string; color: string; icon: any }> = {
  INITIALISATION: { label: "Initialisation", color: "bg-blue-500", icon: Package },
  DEPART_TOURNEE: { label: "Départ Tournée", color: "bg-orange-500", icon: ArrowDownCircle },
  RETOUR_TOURNEE: { label: "Retour Tournée", color: "bg-green-500", icon: ArrowUpCircle },
  SURPLUS: { label: "Surplus", color: "bg-emerald-500", icon: Plus },
  RETOUR_CONFLIT: { label: "Retour Conflit", color: "bg-cyan-500", icon: RefreshCw },
  PERTE_CONFIRMEE: { label: "Perte Confirmée", color: "bg-red-500", icon: XCircle },
  AJUSTEMENT: { label: "Ajustement", color: "bg-purple-500", icon: RefreshCw },
  ACHAT: { label: "Achat", color: "bg-indigo-500", icon: ShoppingCart },
};

const DATE_FILTERS = [
  { value: "all", label: "Tout" },
  { value: "today", label: "Aujourd'hui" },
  { value: "yesterday", label: "Hier" },
  { value: "week", label: "7 derniers jours" },
  { value: "month", label: "30 derniers jours" },
  { value: "custom", label: "Personnalisé..." },
];

const TYPE_FILTERS = [
  { value: "all", label: "Tous les types" },
  { value: "DEPART_TOURNEE", label: "Départs" },
  { value: "RETOUR_TOURNEE", label: "Retours" },
  { value: "PERTE_CONFIRMEE", label: "Pertes" },
  { value: "AJUSTEMENT", label: "Ajustements" },
  { value: "ACHAT", label: "Achats" },
];

export function StockClient({ stock, mouvements, pertes, stockEnTournee, stockPerdu, totalPertesPayees }: StockClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Filters
  const [dateFilter, setDateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Setup wizard state
  const [showSetupWizard, setShowSetupWizard] = useState(!stock?.initialise);
  const [setupQuantite, setSetupQuantite] = useState("");
  
  // Action modals
  const [showAjustementModal, setShowAjustementModal] = useState(false);
  const [ajustementQuantite, setAjustementQuantite] = useState("");
  const [ajustementType, setAjustementType] = useState<"add" | "remove" | "achat">("add");
  const [ajustementNotes, setAjustementNotes] = useState("");

  // Filtered mouvements
  const filteredMouvements = useMemo(() => {
    let filtered = [...mouvements];
    
    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      let start: Date;
      let end: Date = endOfDay(now);
      
      switch (dateFilter) {
        case "today":
          start = startOfDay(now);
          break;
        case "yesterday":
          start = startOfDay(subDays(now, 1));
          end = endOfDay(subDays(now, 1));
          break;
        case "week":
          start = startOfDay(subDays(now, 7));
          break;
        case "month":
          start = startOfDay(subDays(now, 30));
          break;
        case "custom":
          if (customDateRange.from) {
            start = startOfDay(customDateRange.from);
            end = customDateRange.to ? endOfDay(customDateRange.to) : endOfDay(customDateRange.from);
          } else {
            start = new Date(0);
          }
          break;
        default:
          start = new Date(0);
      }
      
      filtered = filtered.filter(m => {
        const date = new Date(m.createdAt);
        return isWithinInterval(date, { start, end });
      });
    }
    
    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(m => m.type === typeFilter);
    }
    
    return filtered;
  }, [mouvements, dateFilter, typeFilter, customDateRange]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredMouvements.length / pageSize);
  const paginatedMouvements = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredMouvements.slice(startIndex, startIndex + pageSize);
  }, [filteredMouvements, currentPage, pageSize]);
  
  // Reset to page 1 when filters change
  const handlePageSizeChange = (newSize: string) => {
    setPageSize(parseInt(newSize));
    setCurrentPage(1);
  };

  // Check for alert
  const alerteActive = stock && stock.dernier_stock_ref > 0 
    ? ((stock.dernier_stock_ref - stock.stock_actuel) / stock.dernier_stock_ref) * 100 >= stock.seuil_alerte_pct
    : false;

  const handleInitialiser = async () => {
    const quantite = parseInt(setupQuantite);
    if (isNaN(quantite) || quantite < 0) {
      toast({ title: "Erreur", description: "Quantité invalide", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initialiser", quantite })
      });
      
      if (!res.ok) throw new Error((await res.json()).error);
      
      toast({ title: "Succès", description: "Stock initialisé avec succès" });
      setShowSetupWizard(false);
      router.refresh();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAjustement = async () => {
    const quantite = parseInt(ajustementQuantite);
    if (isNaN(quantite) || quantite <= 0) {
      toast({ title: "Erreur", description: "Quantité invalide", variant: "destructive" });
      return;
    }
    // Notes required only for add/remove, not for achat
    if (ajustementType !== "achat" && !ajustementNotes.trim()) {
      toast({ title: "Erreur", description: "Notes requises", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
      if (ajustementType === "achat") {
        // Handle as purchase
        const res = await fetch("/api/stock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "achat", quantite, notes: ajustementNotes })
        });
        
        if (!res.ok) throw new Error((await res.json()).error);
        
        toast({ title: "Succès", description: "Achat enregistré" });
      } else {
        // Handle as adjustment
        const finalQuantite = ajustementType === "remove" ? -quantite : quantite;
        const res = await fetch("/api/stock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ajuster", quantite: finalQuantite, notes: ajustementNotes })
        });
        
        if (!res.ok) throw new Error((await res.json()).error);
        
        toast({ title: "Succès", description: "Ajustement enregistré" });
      }
      
      setShowAjustementModal(false);
      setAjustementQuantite("");
      setAjustementNotes("");
      setAjustementType("add");
      router.refresh();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAlerte = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-alerte" })
      });
      
      if (!res.ok) throw new Error((await res.json()).error);
      
      toast({ title: "Succès", description: "Référence alerte réinitialisée" });
      router.refresh();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Setup Wizard
  if (showSetupWizard) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl">Configuration du Stock</CardTitle>
            <CardDescription>
              Avant de commencer le suivi, indiquez le nombre de caisses actuellement en stock.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantite">Nombre de caisses en stock</Label>
              <Input
                id="quantite"
                type="number"
                placeholder="Ex: 1000"
                value={setupQuantite}
                onChange={(e) => setSetupQuantite(e.target.value)}
                min={0}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleInitialiser}
              disabled={isLoading || !setupQuantite}
            >
              {isLoading ? "Initialisation..." : "Démarrer le suivi"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {alerteActive && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-900/20">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-800 dark:text-red-200">
                  ⚠️ Alerte: Stock en baisse critique
                </p>
                <p className="text-sm text-red-600 dark:text-red-300">
                  Le stock a baissé de plus de {stock?.seuil_alerte_pct}% depuis la dernière vérification
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleResetAlerte} disabled={isLoading}>
              Réinitialiser l'alerte
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Actuel</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stock?.stock_actuel.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">caisses disponibles</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Tournée</CardTitle>
            <TruckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockEnTournee.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">caisses en circulation</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pertes Totales</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stockPerdu.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">caisses perdues</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Récupéré</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalPertesPayees.toLocaleString()} TND</div>
            <p className="text-xs text-muted-foreground">des pertes payées</p>
          </CardContent>
        </Card>
      </div>

      {/* Unified Toolbar */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg border">
          {/* Action Button */}
          <Button size="sm" onClick={() => setShowAjustementModal(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Ajustement / Achat
          </Button>
          
          <div className="h-6 w-px bg-border hidden sm:block" />
          
          {/* Tabs */}
          <TabsList className="h-9">
            <TabsTrigger value="overview" className="flex items-center gap-1.5 text-sm px-3">
              <History className="h-3.5 w-3.5" />
              Mouvements
            </TabsTrigger>
            <TabsTrigger value="pertes" className="flex items-center gap-1.5 text-sm px-3">
              <AlertCircle className="h-3.5 w-3.5" />
              Pertes
              {pertes.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 min-w-4 p-0 flex items-center justify-center text-[10px]">
                  {pertes.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <div className="h-6 w-px bg-border hidden sm:block" />
          
          {/* Filters - only show for Mouvements tab */}
          {activeTab === 'overview' && (
            <>
              <Select 
                value={dateFilter} 
                onValueChange={(value) => {
                  setDateFilter(value);
                  setCurrentPage(1);
                  if (value === "custom") {
                    setShowDatePicker(true);
                  }
                }}
              >
                <SelectTrigger className="h-9 w-[130px] text-sm">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FILTERS.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Custom Date Range Picker */}
              {dateFilter === "custom" && (
                <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2 text-sm font-normal">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {customDateRange.from ? (
                        customDateRange.to ? (
                          <>
                            {format(customDateRange.from, "dd/MM", { locale: fr })} - {format(customDateRange.to, "dd/MM", { locale: fr })}
                          </>
                        ) : (
                          format(customDateRange.from, "dd/MM/yyyy", { locale: fr })
                        )
                      ) : (
                        "Choisir dates"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="range"
                      selected={{ from: customDateRange.from, to: customDateRange.to }}
                      onSelect={(range: { from?: Date; to?: Date } | undefined) => {
                        setCustomDateRange({ from: range?.from, to: range?.to });
                      }}
                      numberOfMonths={2}
                      locale={fr}
                    />
                    <div className="flex items-center justify-between p-3 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCustomDateRange({ from: undefined, to: undefined });
                        }}
                      >
                        Effacer
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setShowDatePicker(false)}
                        disabled={!customDateRange.from}
                      >
                        Appliquer
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              
              <Select value={typeFilter} onValueChange={(value) => { setTypeFilter(value); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 w-[140px] text-sm">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_FILTERS.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {(dateFilter !== "all" || typeFilter !== "all") && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => { 
                    setDateFilter("all"); 
                    setTypeFilter("all"); 
                    setCustomDateRange({ from: undefined, to: undefined });
                    setCurrentPage(1);
                  }}
                  className="h-9"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Réinitialiser
                </Button>
              )}
            </>
          )}
          
          <div className="ml-auto text-sm text-muted-foreground whitespace-nowrap">
            {activeTab === 'overview' ? `${filteredMouvements.length} mouvement(s)` : `${pertes.length} perte(s)`}
          </div>
        </div>

        {/* Mouvements Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">

          {/* Mouvements Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Historique des Mouvements
                  </CardTitle>
                  <CardDescription>Suivi de toutes les entrées et sorties de stock</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Afficher</span>
                  <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">lignes</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800/80">
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Quantité</TableHead>
                      <TableHead className="text-center">Solde</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMouvements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          Aucun mouvement trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedMouvements.map((mvt) => {
                        const config = mouvementConfig[mvt.type] || { label: mvt.type, color: "bg-gray-500", icon: Package };
                        const Icon = config.icon;
                        return (
                          <TableRow key={mvt.id} className="dark:border-gray-700">
                            <TableCell className="text-sm">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {format(new Date(mvt.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${config.color} text-white`}>
                                <Icon className="h-3 w-3 mr-1" />
                                {config.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`font-mono font-semibold ${
                                mvt.quantite > 0 ? "text-green-600" : mvt.quantite < 0 ? "text-red-600" : "text-gray-500"
                              }`}>
                                {mvt.quantite > 0 ? "+" : ""}{mvt.quantite}
                              </span>
                            </TableCell>
                            <TableCell className="text-center font-mono">
                              {mvt.solde_apres.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {mvt.tour && (
                                <Badge variant="outline" className="text-xs">
                                  {mvt.tour.matricule_vehicule}
                                </Badge>
                              )}
                              {mvt.conflict && (
                                <Badge variant="destructive" className="text-xs">
                                  Conflit
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {mvt.notes || "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination Controls */}
              {filteredMouvements.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Affichage {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredMouvements.length)} sur {filteredMouvements.length} mouvement(s)
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1 mx-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pertes Tab */}
        <TabsContent value="pertes" className="space-y-4">
          {/* Pertes Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">Total Pertes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{stockPerdu}</div>
                <p className="text-xs text-red-600/80">caisses perdues au total</p>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Montant Récupéré</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{totalPertesPayees.toLocaleString()} TND</div>
                <p className="text-xs text-green-600/80">payé par les chauffeurs</p>
              </CardContent>
            </Card>
            
            <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200">Conflits Actifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">
                  {pertes.filter(p => p.statut !== 'RESOLUE').length}
                </div>
                <p className="text-xs text-amber-600/80">en cours de résolution</p>
              </CardContent>
            </Card>
          </div>

          {/* Pertes Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Historique des Pertes
              </CardTitle>
              <CardDescription>Toutes les pertes de caisses signalées et leur statut</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800/80">
                      <TableHead>Date</TableHead>
                      <TableHead>Véhicule</TableHead>
                      <TableHead>Chauffeur</TableHead>
                      <TableHead>Secteur</TableHead>
                      <TableHead className="text-center">Caisses Perdues</TableHead>
                      <TableHead className="text-center">Retournées</TableHead>
                      <TableHead className="text-center">Montant</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pertes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
                          Aucune perte enregistrée
                        </TableCell>
                      </TableRow>
                    ) : (
                      pertes.map((perte) => (
                        <TableRow key={perte.id} className="dark:border-gray-700">
                          <TableCell className="text-sm">
                            {format(new Date(perte.createdAt), "dd/MM/yyyy", { locale: fr })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {perte.tour?.matricule_vehicule || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {perte.tour?.driver?.nom_complet || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {perte.tour?.secteur?.nom || "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-semibold text-red-600">
                              {perte.quantite_perdue}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-semibold text-green-600">
                              {perte.caisses_retournees || 0}
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {perte.montant_paye?.toLocaleString() || 0} TND
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={perte.statut === 'RESOLUE' ? 'default' : 'destructive'}
                              className={perte.statut === 'RESOLUE' ? 'bg-green-500' : ''}
                            >
                              {perte.statut === 'RESOLUE' ? 'Résolue' : 
                               perte.statut === 'EN_ATTENTE' ? 'En attente' : perte.statut}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ajustement Modal */}
      <Dialog open={showAjustementModal} onOpenChange={setShowAjustementModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustement / Achat de Stock</DialogTitle>
            <DialogDescription>
              Corriger le stock ou enregistrer un nouvel achat de caisses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type d'opération</Label>
              <Select value={ajustementType} onValueChange={(v) => setAjustementType(v as "add" | "remove" | "achat")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-green-600" /> Ajouter au stock (ajustement)
                    </span>
                  </SelectItem>
                  <SelectItem value="remove">
                    <span className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-red-600" /> Retirer du stock (ajustement)
                    </span>
                  </SelectItem>
                  <SelectItem value="achat">
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-indigo-600" /> Nouvel achat
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ajust-quantite">
                {ajustementType === "achat" ? "Nombre de caisses achetées" : "Quantité"}
              </Label>
              <Input
                id="ajust-quantite"
                type="number"
                placeholder={ajustementType === "achat" ? "Ex: 100" : "Ex: 10"}
                value={ajustementQuantite}
                onChange={(e) => setAjustementQuantite(e.target.value)}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ajust-notes">
                {ajustementType === "achat" ? "Notes (optionnel)" : "Raison de l'ajustement *"}
              </Label>
              <Textarea
                id="ajust-notes"
                placeholder={ajustementType === "achat" ? "Ex: Fournisseur, numéro facture..." : "Ex: Correction suite à inventaire physique..."}
                value={ajustementNotes}
                onChange={(e) => setAjustementNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAjustementModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleAjustement} disabled={isLoading}>
              {isLoading ? "Enregistrement..." : ajustementType === "achat" ? "Enregistrer l'achat" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
