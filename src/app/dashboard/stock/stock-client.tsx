"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  History
} from "lucide-react";
import { format } from "date-fns";
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

interface StockClientProps {
  stock: StockCaisse | null;
  mouvements: Mouvement[];
  stockEnTournee: number;
  stockPerdu: number;
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

export function StockClient({ stock, mouvements, stockEnTournee, stockPerdu }: StockClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Setup wizard state
  const [showSetupWizard, setShowSetupWizard] = useState(!stock?.initialise);
  const [setupQuantite, setSetupQuantite] = useState("");
  
  // Action modals
  const [showAjustementModal, setShowAjustementModal] = useState(false);
  const [showAchatModal, setShowAchatModal] = useState(false);
  const [ajustementQuantite, setAjustementQuantite] = useState("");
  const [ajustementType, setAjustementType] = useState<"add" | "remove">("add");
  const [ajustementNotes, setAjustementNotes] = useState("");
  const [achatQuantite, setAchatQuantite] = useState("");
  const [achatNotes, setAchatNotes] = useState("");

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
    if (!ajustementNotes.trim()) {
      toast({ title: "Erreur", description: "Notes requises", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
      const finalQuantite = ajustementType === "remove" ? -quantite : quantite;
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ajuster", quantite: finalQuantite, notes: ajustementNotes })
      });
      
      if (!res.ok) throw new Error((await res.json()).error);
      
      toast({ title: "Succès", description: "Ajustement enregistré" });
      setShowAjustementModal(false);
      setAjustementQuantite("");
      setAjustementNotes("");
      router.refresh();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAchat = async () => {
    const quantite = parseInt(achatQuantite);
    if (isNaN(quantite) || quantite <= 0) {
      toast({ title: "Erreur", description: "Quantité invalide", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "achat", quantite, notes: achatNotes })
      });
      
      if (!res.ok) throw new Error((await res.json()).error);
      
      toast({ title: "Succès", description: "Achat enregistré" });
      setShowAchatModal(false);
      setAchatQuantite("");
      setAchatNotes("");
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
            <p className="text-xs text-muted-foreground">caisses perdues (payées)</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Initial</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stock?.stock_initial.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">depuis l'initialisation</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button onClick={() => setShowAjustementModal(true)}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Ajustement
        </Button>
        <Button variant="outline" onClick={() => setShowAchatModal(true)}>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Nouvel Achat
        </Button>
      </div>

      {/* Mouvements History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique des Mouvements
              </CardTitle>
              <CardDescription>Les 50 derniers mouvements de stock</CardDescription>
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
                  <TableHead className="text-center">Solde Après</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mouvements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      Aucun mouvement enregistré
                    </TableCell>
                  </TableRow>
                ) : (
                  mouvements.map((mvt) => {
                    const config = mouvementConfig[mvt.type] || { label: mvt.type, color: "bg-gray-500", icon: Package };
                    const Icon = config.icon;
                    return (
                      <TableRow key={mvt.id} className="dark:border-gray-700">
                        <TableCell className="text-sm">
                          {format(new Date(mvt.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}
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
                              Tour: {mvt.tour.matricule_vehicule}
                            </Badge>
                          )}
                          {mvt.conflict && (
                            <Badge variant="outline" className="text-xs">
                              Conflit: {mvt.conflict.quantite_perdue} caisses
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {mvt.user?.name || "—"}
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
        </CardContent>
      </Card>

      {/* Ajustement Modal */}
      <Dialog open={showAjustementModal} onOpenChange={setShowAjustementModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustement de Stock</DialogTitle>
            <DialogDescription>
              Corriger le stock suite à un inventaire ou une erreur de comptage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type d'ajustement</Label>
              <Select value={ajustementType} onValueChange={(v) => setAjustementType(v as "add" | "remove")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-green-600" /> Ajouter au stock
                    </span>
                  </SelectItem>
                  <SelectItem value="remove">
                    <span className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-red-600" /> Retirer du stock
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ajust-quantite">Quantité</Label>
              <Input
                id="ajust-quantite"
                type="number"
                placeholder="Ex: 10"
                value={ajustementQuantite}
                onChange={(e) => setAjustementQuantite(e.target.value)}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ajust-notes">Raison de l'ajustement *</Label>
              <Textarea
                id="ajust-notes"
                placeholder="Ex: Correction suite à inventaire physique..."
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
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Achat Modal */}
      <Dialog open={showAchatModal} onOpenChange={setShowAchatModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel Achat de Caisses</DialogTitle>
            <DialogDescription>
              Enregistrer l'achat de nouvelles caisses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="achat-quantite">Nombre de caisses achetées</Label>
              <Input
                id="achat-quantite"
                type="number"
                placeholder="Ex: 100"
                value={achatQuantite}
                onChange={(e) => setAchatQuantite(e.target.value)}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="achat-notes">Notes (optionnel)</Label>
              <Textarea
                id="achat-notes"
                placeholder="Ex: Fournisseur, numéro facture..."
                value={achatNotes}
                onChange={(e) => setAchatNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAchatModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleAchat} disabled={isLoading}>
              {isLoading ? "Enregistrement..." : "Enregistrer l'achat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
