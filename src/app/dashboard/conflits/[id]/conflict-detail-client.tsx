"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertCircle, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  TruckIcon, 
  User, 
  Calendar, 
  ArrowLeft,
  AlertTriangle,
  MapPin,
  Package,
  Scale,
  Loader2,
  FileText,
  Link as LinkIcon,
  Banknote,
  History,
  ArrowUpCircle
} from "lucide-react";
import MatriculeDisplay from "@/components/MatriculeDisplay";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";

type ConflictStatus = "EN_ATTENTE" | "PAYEE" | "ANNULE" | "RESOLUE";

interface Resolution {
  id: string;
  type: string;
  quantite: number | null;
  montant: number | null;
  modePaiement: string | null;
  createdAt: Date | string;
  user: { name: string | null } | null;
}

interface Conflict {
  id: string;
  tourId: string;
  quantite_perdue: number;
  montant_dette_tnd: number;
  caisses_retournees: number;
  montant_paye: number;
  statut: ConflictStatus;
  notes_direction: string | null;
  depasse_tolerance: boolean;
  date_approbation_direction: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  resolutions?: Resolution[];
  tour: {
    id: string;
    matricule_vehicule: string;
    nbre_caisses_depart: number;
    nbre_caisses_retour: number | null;
    poids_brut_securite_sortie: number | null;
    poids_brut_securite_retour: number | null;
    statut: string;
    createdAt: Date | string;
    driver: {
      id: string;
      nom_complet: string;
      tolerance_caisses_mensuelle: number;
    } | null;
    secteur: {
      id: string;
      nom: string;
    } | null;
    agentControle: {
      id: string;
      name: string | null;
    } | null;
    lignesRetour: {
      id: string;
      nbre_caisses: number;
      poids_net_retour: number;
      produit: {
        id: string;
        nom: string;
      } | null;
    }[];
  };
}

interface ConflictDetailClientProps {
  conflict: Conflict;
}

const statusConfig = {
  EN_ATTENTE: {
    label: "En attente de résolution",
    color: "text-orange-700 dark:text-orange-300",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    borderColor: "border-orange-500",
    icon: Clock,
  },
  PAYEE: {
    label: "Payée (ancien)",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-500",
    icon: CheckCircle,
  },
  ANNULE: {
    label: "Annulé (ancien)",
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-900/30",
    borderColor: "border-gray-500",
    icon: CheckCircle,
  },
  RESOLUE: {
    label: "Résolu",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-500",
    icon: CheckCircle,
  },
};

const PRIX_CAISSE_TND = 15;

export function ConflictDetailClient({ conflict }: ConflictDetailClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRetourModal, setShowRetourModal] = useState(false);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [retourQuantite, setRetourQuantite] = useState("");
  const [paiementMontant, setPaiementMontant] = useState("");
  const [modePaiement, setModePaiement] = useState<"ESPECES" | "RETENUE_SALAIRE">("ESPECES");
  const { toast } = useToast();
  const router = useRouter();

  const config = statusConfig[conflict.statut] || statusConfig.EN_ATTENTE;
  const StatusIcon = config.icon;
  const isPending = conflict.statut === "EN_ATTENTE";

  // Calculate remaining amounts
  const caissesRestantes = conflict.quantite_perdue - conflict.caisses_retournees;
  const montantRestant = conflict.montant_dette_tnd - conflict.montant_paye;
  const progressPct = conflict.quantite_perdue > 0 
    ? ((conflict.caisses_retournees + (conflict.montant_paye / PRIX_CAISSE_TND)) / conflict.quantite_perdue) * 100
    : 0;

  // Calculate max values for inputs
  const maxRetour = caissesRestantes;
  const maxPaiement = Math.max(0, montantRestant);

  const handleRetour = async () => {
    const quantite = parseInt(retourQuantite);
    if (isNaN(quantite) || quantite <= 0 || quantite > maxRetour) {
      toast({
        title: "Erreur",
        description: `Quantité invalide. Max: ${maxRetour} caisses`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/conflicts/${conflict.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "retour", quantite }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }

      const data = await res.json();
      toast({
        title: "✅ Retour enregistré",
        description: `${quantite} caisses retournées. ${data.autoResolved ? "Conflit résolu!" : ""}`,
      });
      setShowRetourModal(false);
      setRetourQuantite("");
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaiement = async () => {
    const montant = parseFloat(paiementMontant);
    if (isNaN(montant) || montant <= 0 || montant > maxPaiement + 0.01) {
      toast({
        title: "Erreur",
        description: `Montant invalide. Max: ${maxPaiement.toFixed(2)} TND`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/conflicts/${conflict.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "paiement", montant, modePaiement }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }

      const data = await res.json();
      toast({
        title: "✅ Paiement enregistré",
        description: `${montant.toFixed(2)} TND payés. ${data.autoResolved ? "Conflit résolu!" : ""}`,
      });
      setShowPaiementModal(false);
      setPaiementMontant("");
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate difference
  const caisseDifference = conflict.tour.nbre_caisses_retour !== null 
    ? conflict.tour.nbre_caisses_depart - conflict.tour.nbre_caisses_retour 
    : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <Button variant="ghost" className="gap-2" asChild>
        <Link href="/dashboard/conflits">
          <ArrowLeft className="h-4 w-4" />
          Retour aux conflits
        </Link>
      </Button>

      {/* Header Card */}
      <Card className={`border-none shadow-lg dark:bg-gray-800/50 border-l-4 ${config.borderColor}`}>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <MatriculeDisplay 
                matricule={conflict.tour.matricule_vehicule}
                size="lg"
              />
              <div>
                <CardTitle className="text-2xl">Détails du Conflit</CardTitle>
                <CardDescription className="dark:text-gray-400 mt-1">
                  Créé le {format(new Date(conflict.createdAt), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {conflict.depasse_tolerance && (
                <Badge variant="destructive" className="text-sm py-1 px-3">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Tolérance dépassée
                </Badge>
              )}
              <Badge className={`${config.bgColor} ${config.color} border-none text-sm py-1 px-3`}>
                <StatusIcon className="h-4 w-4 mr-1" />
                {config.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Resolution Progress Card - Only for pending conflicts */}
      {isPending && (
        <Card className="border-none shadow-lg dark:bg-gray-800/50 border-2 border-orange-300 dark:border-orange-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <AlertCircle className="h-5 w-5" />
              État de Résolution
            </CardTitle>
            <CardDescription>
              Progression vers la résolution complète du conflit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progression globale</span>
                <span className="font-semibold">{Math.min(100, progressPct).toFixed(0)}%</span>
              </div>
              <Progress value={Math.min(100, progressPct)} className="h-3" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{conflict.quantite_perdue}</p>
                <p className="text-xs text-muted-foreground">Caisses perdues</p>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{conflict.caisses_retournees}</p>
                <p className="text-xs text-muted-foreground">Retournées</p>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{conflict.montant_paye.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">TND payés</p>
              </div>
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{caissesRestantes}</p>
                <p className="text-xs text-muted-foreground">À résoudre</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => setShowRetourModal(true)}
                disabled={caissesRestantes <= 0}
              >
                <ArrowUpCircle className="h-5 w-5 mr-2" />
                Enregistrer Retour
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                onClick={() => setShowPaiementModal(true)}
                disabled={montantRestant <= 0}
              >
                <Banknote className="h-5 w-5 mr-2" />
                Enregistrer Paiement
              </Button>
            </div>

            {/* Info message */}
            <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Le conflit sera automatiquement résolu lorsque toutes les caisses seront 
                retournées ou que le montant total sera payé (ou une combinaison des deux).
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Caisses Perdues</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                  -{conflict.quantite_perdue}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-red-500">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Montant Dette</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                  {conflict.montant_dette_tnd.toFixed(2)} <span className="text-lg">TND</span>
                </p>
                {conflict.montant_paye > 0 && (
                  <p className="text-sm text-green-600">
                    -{conflict.montant_paye.toFixed(2)} payés
                  </p>
                )}
              </div>
              <div className="p-3 rounded-xl bg-blue-500">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Caisses Départ</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {conflict.tour.nbre_caisses_depart}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500">
                <TruckIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Caisses Retour</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {conflict.tour.nbre_caisses_retour ?? "—"}
                  {caisseDifference !== null && caisseDifference > 0 && (
                    <span className="text-sm text-red-500 ml-2">(-{caisseDifference})</span>
                  )}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-500">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resolution History */}
      {conflict.resolutions && conflict.resolutions.length > 0 && (
        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique des Résolutions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/80">
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-center">Quantité</TableHead>
                    <TableHead className="text-center">Montant</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Utilisateur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conflict.resolutions.map((res) => (
                    <TableRow key={res.id}>
                      <TableCell>
                        {format(new Date(res.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Badge className={res.type === "RETOUR" ? "bg-green-500" : "bg-blue-500"}>
                          {res.type === "RETOUR" ? (
                            <><ArrowUpCircle className="h-3 w-3 mr-1" /> Retour</>
                          ) : (
                            <><Banknote className="h-3 w-3 mr-1" /> Paiement</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {res.type === "RETOUR" ? `${res.quantite} caisses` : "—"}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {res.montant ? `${res.montant.toFixed(2)} TND` : "—"}
                      </TableCell>
                      <TableCell>
                        {res.modePaiement === "ESPECES" ? (
                          <Badge variant="outline">Espèces</Badge>
                        ) : res.modePaiement === "RETENUE_SALAIRE" ? (
                          <Badge variant="outline">Retenue salaire</Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell>{res.user?.name || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Driver & Tour Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Driver Info */}
        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations Chauffeur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Nom</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {conflict.tour.driver?.nom_complet || "Non assigné"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Tolérance mensuelle</span>
              <Badge variant="outline" className="font-mono">
                {conflict.tour.driver?.tolerance_caisses_mensuelle || 0} caisses
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Secteur</span>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  {conflict.tour.secteur?.nom || "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tour Info */}
        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5" />
              Informations Tournée
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Date de la tournée</span>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  {format(new Date(conflict.tour.createdAt), "dd MMM yyyy", { locale: fr })}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Agent de contrôle</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {conflict.tour.agentControle?.name || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Poids départ</span>
              <Badge variant="outline" className="font-mono">
                <Scale className="h-3 w-3 mr-1" />
                {conflict.tour.poids_brut_securite_sortie?.toFixed(2) || "—"} kg
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Poids retour</span>
              <Badge variant="outline" className="font-mono">
                <Scale className="h-3 w-3 mr-1" />
                {conflict.tour.poids_brut_securite_retour?.toFixed(2) || "—"} kg
              </Badge>
            </div>
            <Separator />
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/dashboard/tours/${conflict.tour.id}`}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Voir la tournée complète
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Returned Products */}
      {conflict.tour.lignesRetour.length > 0 && (
        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produits Retournés
              <Badge variant="secondary" className="ml-2">
                {conflict.tour.lignesRetour.length}
              </Badge>
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Liste des produits retournés lors de cette tournée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/80">
                    <TableHead className="font-semibold dark:text-gray-200">Produit</TableHead>
                    <TableHead className="font-semibold text-center dark:text-gray-200">Quantité</TableHead>
                    <TableHead className="font-semibold text-center dark:text-gray-200">Poids (kg)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conflict.tour.lignesRetour.map((ligne) => (
                    <TableRow key={ligne.id} className="dark:border-gray-700">
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                        {ligne.produit?.nom || "Produit inconnu"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {ligne.nbre_caisses}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {ligne.poids_net_retour?.toFixed(2) || "—"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes de Direction */}
      {conflict.notes_direction && (
        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes de Direction
            </CardTitle>
            {conflict.date_approbation_direction && (
              <CardDescription className="dark:text-gray-400">
                Décision prise le {format(new Date(conflict.date_approbation_direction), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border dark:border-gray-700">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {conflict.notes_direction}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Retour Modal */}
      <Dialog open={showRetourModal} onOpenChange={setShowRetourModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer un Retour de Caisses</DialogTitle>
            <DialogDescription>
              Le chauffeur retourne des caisses manquantes.
              Maximum: {maxRetour} caisses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="retour-quantite">Nombre de caisses retournées</Label>
              <Input
                id="retour-quantite"
                type="number"
                placeholder={`Max: ${maxRetour}`}
                value={retourQuantite}
                onChange={(e) => setRetourQuantite(e.target.value)}
                min={1}
                max={maxRetour}
              />
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
              <p>Après ce retour:</p>
              <ul className="list-disc list-inside mt-1 text-muted-foreground">
                <li>Caisses restantes: {caissesRestantes - (parseInt(retourQuantite) || 0)}</li>
                <li>Dette restante: {(montantRestant - (parseInt(retourQuantite) || 0) * PRIX_CAISSE_TND).toFixed(2)} TND</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRetourModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleRetour} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowUpCircle className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paiement Modal */}
      <Dialog open={showPaiementModal} onOpenChange={setShowPaiementModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer un Paiement</DialogTitle>
            <DialogDescription>
              Le chauffeur paie pour les caisses manquantes.
              Montant restant dû: {maxPaiement.toFixed(2)} TND
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paiement-montant">Montant (TND)</Label>
              <Input
                id="paiement-montant"
                type="number"
                step="0.01"
                placeholder={`Max: ${maxPaiement.toFixed(2)}`}
                value={paiementMontant}
                onChange={(e) => setPaiementMontant(e.target.value)}
                min={0.01}
                max={maxPaiement}
              />
            </div>
            <div className="space-y-2">
              <Label>Mode de paiement</Label>
              <Select value={modePaiement} onValueChange={(v) => setModePaiement(v as "ESPECES" | "RETENUE_SALAIRE")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ESPECES">
                    <span className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" /> Espèces
                    </span>
                  </SelectItem>
                  <SelectItem value="RETENUE_SALAIRE">
                    <span className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" /> Retenue sur salaire
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
              <p>Ce paiement couvre environ <strong>{Math.floor((parseFloat(paiementMontant) || 0) / PRIX_CAISSE_TND)}</strong> caisses</p>
              <p className="text-muted-foreground mt-1">
                (Prix par caisse: {PRIX_CAISSE_TND} TND)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaiementModal(false)}>
              Annuler
            </Button>
            <Button onClick={handlePaiement} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Banknote className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
