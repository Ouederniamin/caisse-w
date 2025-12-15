"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
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
  Link as LinkIcon
} from "lucide-react";
import MatriculeDisplay from "@/components/MatriculeDisplay";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { approveConflict, rejectConflict } from "../actions";
import { useRouter } from "next/navigation";

type ConflictStatus = "EN_ATTENTE" | "PAYEE" | "ANNULE";

interface Conflict {
  id: string;
  tourId: string;
  quantite_perdue: number;
  montant_dette_tnd: number;
  statut: ConflictStatus;
  notes_direction: string | null;
  depasse_tolerance: boolean;
  date_approbation_direction: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
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
    label: "En attente",
    color: "text-orange-700 dark:text-orange-300",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    borderColor: "border-orange-500",
    icon: Clock,
  },
  PAYEE: {
    label: "Payée",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-500",
    icon: CheckCircle,
  },
  ANNULE: {
    label: "Annulé",
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    borderColor: "border-red-500",
    icon: XCircle,
  },
};

export function ConflictDetailClient({ conflict }: ConflictDetailClientProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const config = statusConfig[conflict.statut];
  const StatusIcon = config.icon;
  const isPending = conflict.statut === "EN_ATTENTE";

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const result = await approveConflict(conflict.id);
      if (result.success) {
        toast({
          title: "✅ Conflit approuvé",
          description: `Le conflit a été approuvé avec succès.`,
        });
        router.refresh();
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectNotes.trim()) {
      toast({
        title: "Note requise",
        description: "Veuillez ajouter une note pour rejeter le conflit.",
        variant: "destructive",
      });
      return;
    }

    setIsRejecting(true);
    try {
      const result = await rejectConflict(conflict.id, rejectNotes);
      if (result.success) {
        toast({
          title: "❌ Conflit rejeté",
          description: `Le conflit a été rejeté.`,
        });
        setShowRejectDialog(false);
        setRejectNotes("");
        router.refresh();
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
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

      {/* Actions - Only for pending conflicts */}
      {isPending && (
        <Card className="border-none shadow-lg dark:bg-gray-800/50 border-2 border-orange-300 dark:border-orange-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <AlertCircle className="h-5 w-5" />
              Actions Requises
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Ce conflit est en attente de votre décision
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={isApproving}
              >
                {isApproving ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-5 w-5 mr-2" />
                )}
                Approuver le conflit
              </Button>
              <Button
                size="lg"
                variant="destructive"
                className="flex-1"
                onClick={() => setShowRejectDialog(true)}
                disabled={isRejecting}
              >
                <XCircle className="h-5 w-5 mr-2" />
                Rejeter le conflit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter le conflit</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison du rejet pour le conflit de{" "}
              {conflict.tour.driver?.nom_complet || "ce chauffeur"} ({conflict.quantite_perdue} caisses perdues).
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Raison du rejet..."
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || !rejectNotes.trim()}
            >
              {isRejecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
