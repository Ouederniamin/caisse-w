"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import {
  Shield,
  Calendar,
  TruckIcon,
  AlertTriangle,
  ArrowLeft,
  MapPin,
  CheckCircle2,
  Clock,
  Package,
  Edit,
  Save,
  X,
  Scale,
  Car,
  Wallet,
  Eye,
  AlertCircle,
  PackageX,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import MatriculeDisplay from "@/components/MatriculeDisplay";
import MatriculeInput from "@/components/MatriculeInput";
import { useToast } from "@/hooks/use-toast";

interface Driver {
  id: string;
  nom_complet: string;
  matricule_par_defaut: string | null;
  marque_vehicule: string | null;
  poids_tare_vehicule: number | null;
  tolerance_caisses_mensuelle: number;
  createdAt: Date;
  updatedAt: Date;
  tours: {
    id: string;
    statut: string;
    matricule_vehicule: string;
    nbre_caisses_depart: number;
    nbre_caisses_retour: number | null;
    createdAt: Date;
    secteur: {
      id: string;
      nom: string;
    } | null;
    conflicts: {
      id: string;
      statut: string;
      quantite_perdue: number;
      montant_dette_tnd: number;
    }[];
  }[];
}

interface DriverStats {
  thisMonth: {
    tours: number;
    caissesDepart: number;
    caissesRetour: number;
    caissesPerdues: number;
  };
  allTime: {
    tours: number;
    conflicts: number;
    pendingConflicts: number;
    paidConflicts: number;
    cancelledConflicts: number;
    totalDebt: number;
    paidDebt: number;
    cancelledDebt: number;
    totalCaissesPerdues: number;
    uniqueSectors: string[];
  };
}

interface DriverDetailClientProps {
  driver: Driver;
  stats: DriverStats;
}

export function DriverDetailClient({ driver, stats }: DriverDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    nom_complet: driver.nom_complet,
    matricule_par_defaut: driver.matricule_par_defaut || "",
    marque_vehicule: driver.marque_vehicule || "",
    poids_tare_vehicule: driver.poids_tare_vehicule?.toString() || "",
    tolerance_caisses_mensuelle: driver.tolerance_caisses_mensuelle,
  });

  const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
    PESEE_VIDE: { label: "Pesée à vide", color: "text-gray-700 dark:text-gray-300", bgColor: "bg-gray-100 dark:bg-gray-800", icon: Package },
    EN_CHARGEMENT: { label: "En chargement", color: "text-amber-700 dark:text-amber-300", bgColor: "bg-amber-100 dark:bg-amber-900/30", icon: Package },
    PRET_A_PARTIR: { label: "Prêt à partir", color: "text-blue-700 dark:text-blue-300", bgColor: "bg-blue-100 dark:bg-blue-900/30", icon: Package },
    EN_TOURNEE: { label: "En tournée", color: "text-purple-700 dark:text-purple-300", bgColor: "bg-purple-100 dark:bg-purple-900/30", icon: TruckIcon },
    RETOUR: { label: "Retour usine", color: "text-violet-700 dark:text-violet-300", bgColor: "bg-violet-100 dark:bg-violet-900/30", icon: TruckIcon },
    EN_ATTENTE_DECHARGEMENT: { label: "Déchargé", color: "text-teal-700 dark:text-teal-300", bgColor: "bg-teal-100 dark:bg-teal-900/30", icon: Package },
    EN_ATTENTE_HYGIENE: { label: "Attente hygiène", color: "text-yellow-700 dark:text-yellow-300", bgColor: "bg-yellow-100 dark:bg-yellow-900/30", icon: AlertCircle },
    TERMINEE: { label: "Terminée", color: "text-green-700 dark:text-green-300", bgColor: "bg-green-100 dark:bg-green-900/30", icon: CheckCircle2 },
  };

  const recentTours = useMemo(() => driver.tours.slice(0, 20), [driver.tours]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/drivers/${driver.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom_complet: editForm.nom_complet,
          matricule_par_defaut: editForm.matricule_par_defaut || null,
          marque_vehicule: editForm.marque_vehicule || null,
          poids_tare_vehicule: editForm.poids_tare_vehicule ? parseFloat(editForm.poids_tare_vehicule) : null,
          tolerance_caisses_mensuelle: editForm.tolerance_caisses_mensuelle,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      toast({
        title: "Succès",
        description: "Les informations du chauffeur ont été mises à jour",
      });
      setIsEditing(false);
      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Une erreur est survenue";
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      nom_complet: driver.nom_complet,
      matricule_par_defaut: driver.matricule_par_defaut || "",
      marque_vehicule: driver.marque_vehicule || "",
      poids_tare_vehicule: driver.poids_tare_vehicule?.toString() || "",
      tolerance_caisses_mensuelle: driver.tolerance_caisses_mensuelle,
    });
    setIsEditing(false);
  };

  const toleranceUsed = stats.thisMonth.caissesPerdues;
  const toleranceLimit = driver.tolerance_caisses_mensuelle;
  const tolerancePercent = toleranceLimit > 0 ? Math.min((toleranceUsed / toleranceLimit) * 100, 100) : 0;
  const isOverTolerance = toleranceUsed > toleranceLimit;

  return (
    <ScrollArea className="h-[calc(100vh-120px)]">
      <div className="space-y-6 pb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/dashboard/chauffeurs"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{driver.nom_complet}</h1>
              <p className="text-gray-600 dark:text-gray-400">Ajouté le {format(new Date(driver.createdAt), "dd MMMM yyyy", { locale: fr })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}><Edit className="h-4 w-4 mr-2" />Modifier</Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={isLoading}><X className="h-4 w-4 mr-2" />Annuler</Button>
                <Button onClick={handleSave} disabled={isLoading}><Save className="h-4 w-4 mr-2" />{isLoading ? "Enregistrement..." : "Enregistrer"}</Button>
              </>
            )}
          </div>
        </div>

        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Car className="h-5 w-5" />Configuration Véhicule & Paramètres</CardTitle>
            <CardDescription className="dark:text-gray-400">Paramètres de pesée et tolérance de conflits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-gray-400">Nom Complet</Label>
                {isEditing ? (
                  <Input value={editForm.nom_complet} onChange={(e) => setEditForm({ ...editForm, nom_complet: e.target.value })} placeholder="Nom du chauffeur" />
                ) : (
                  <p className="font-semibold text-gray-900 dark:text-white">{driver.nom_complet}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-gray-400">Matricule par Défaut</Label>
                {isEditing ? (
                  <MatriculeInput value={editForm.matricule_par_defaut} onChange={(value) => setEditForm({ ...editForm, matricule_par_defaut: value })} placeholder="Matricule du véhicule" />
                ) : driver.matricule_par_defaut ? (
                  <MatriculeDisplay matricule={driver.matricule_par_defaut} size="sm" />
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Non défini</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-gray-400">Marque Véhicule</Label>
                {isEditing ? (
                  <Input value={editForm.marque_vehicule} onChange={(e) => setEditForm({ ...editForm, marque_vehicule: e.target.value })} placeholder="Ex: Isuzu, Hyundai..." />
                ) : (
                  <p className={`font-medium ${driver.marque_vehicule ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 text-sm'}`}>{driver.marque_vehicule || "Non défini"}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1"><Scale className="h-3 w-3" />Poids Tare (kg)</Label>
                {isEditing ? (
                  <Input type="number" step="0.01" min="0" value={editForm.poids_tare_vehicule} onChange={(e) => setEditForm({ ...editForm, poids_tare_vehicule: e.target.value })} placeholder="Ex: 3500" />
                ) : driver.poids_tare_vehicule ? (
                  <Badge variant="outline" className="text-base px-3 py-1">{driver.poids_tare_vehicule.toLocaleString()} kg</Badge>
                ) : (
                  <Badge variant="destructive" className="text-sm"><AlertCircle className="h-3 w-3 mr-1" />Non configuré</Badge>
                )}
                {!isEditing && !driver.poids_tare_vehicule && <p className="text-xs text-orange-600 dark:text-orange-400">Requis pour validation des pesées</p>}
              </div>
            </div>
            <Separator className="my-6" />
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1"><Shield className="h-3 w-3" />Tolérance Caisses Mensuelle</Label>
                  {isEditing ? (
                    <Input type="number" min="0" className="w-24" value={editForm.tolerance_caisses_mensuelle} onChange={(e) => setEditForm({ ...editForm, tolerance_caisses_mensuelle: parseInt(e.target.value) || 0 })} />
                  ) : (
                    <Badge variant="secondary" className="text-base px-3 py-1">{driver.tolerance_caisses_mensuelle} caisses</Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Nombre de caisses perdues autorisées par mois avant déclenchement automatique de conflit</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Usage ce mois</span>
                  <span className={`font-bold ${isOverTolerance ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{toleranceUsed} / {toleranceLimit} caisses</span>
                </div>
                <Progress value={tolerancePercent} className={`h-3 ${isOverTolerance ? '[&>div]:bg-red-500' : ''}`} />
                {isOverTolerance && <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Tolérance dépassée de {toleranceUsed - toleranceLimit} caisses</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Calendar className="h-5 w-5" />Ce Mois ({format(new Date(), "MMMM yyyy", { locale: fr })})</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-none shadow-lg dark:bg-gray-800/50 border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Tournées</CardTitle>
                <div className="p-2 rounded-lg bg-blue-500"><TruckIcon className="h-4 w-4 text-white" /></div>
              </CardHeader>
              <CardContent><div className="text-3xl font-bold">{stats.thisMonth.tours}</div></CardContent>
            </Card>
            <Card className="border-none shadow-lg dark:bg-gray-800/50 border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Caisses Départ</CardTitle>
                <div className="p-2 rounded-lg bg-green-500"><Package className="h-4 w-4 text-white" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.thisMonth.caissesDepart.toLocaleString()}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stats.thisMonth.caissesRetour.toLocaleString()} retournées</p>
              </CardContent>
            </Card>
            <Card className={`border-none shadow-lg dark:bg-gray-800/50 border-l-4 ${isOverTolerance ? 'border-l-red-500' : 'border-l-orange-500'}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Caisses Perdues</CardTitle>
                <div className={`p-2 rounded-lg ${isOverTolerance ? 'bg-red-500' : 'bg-orange-500'}`}><PackageX className="h-4 w-4 text-white" /></div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${isOverTolerance ? 'text-red-600' : ''}`}>{stats.thisMonth.caissesPerdues}</div>
                {isOverTolerance && <p className="text-xs text-red-500 mt-1">Dépassement tolérance!</p>}
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg dark:bg-gray-800/50 border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Secteurs</CardTitle>
                <div className="p-2 rounded-lg bg-purple-500"><MapPin className="h-4 w-4 text-white" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.allTime.uniqueSectors.length}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{stats.allTime.uniqueSectors.slice(0, 3).join(", ")}{stats.allTime.uniqueSectors.length > 3 && "..."}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />Situation Financière</CardTitle>
            <CardDescription className="dark:text-gray-400">Dettes et conflits (toutes périodes)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 mb-2"><Clock className="h-4 w-4" /><span className="text-sm font-medium">Dette en Attente</span></div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.allTime.totalDebt.toFixed(2)} <span className="text-sm">TND</span></p>
                <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1">{stats.allTime.pendingConflicts} conflit(s)</p>
              </div>
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2"><CheckCircle2 className="h-4 w-4" /><span className="text-sm font-medium">Dette Payée</span></div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.allTime.paidDebt.toFixed(2)} <span className="text-sm">TND</span></p>
                <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">{stats.allTime.paidConflicts} conflit(s) réglé(s)</p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-400 mb-2"><X className="h-4 w-4" /><span className="text-sm font-medium">Dette Annulée</span></div>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.allTime.cancelledDebt.toFixed(2)} <span className="text-sm">TND</span></p>
                <p className="text-xs text-gray-600/80 dark:text-gray-400/80 mt-1">{stats.allTime.cancelledConflicts} conflit(s) annulé(s)</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2"><PackageX className="h-4 w-4" /><span className="text-sm font-medium">Total Caisses Perdues</span></div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.allTime.totalCaissesPerdues}</p>
                <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">{stats.allTime.conflicts} conflit(s) total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><TruckIcon className="h-5 w-5" />Historique des Tournées<Badge variant="secondary">{driver.tours.length}</Badge></CardTitle>
                <CardDescription className="dark:text-gray-400">{recentTours.length > 0 ? `${recentTours.length} dernière(s) tournée(s)` : "Aucune tournée"}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {recentTours.length === 0 ? (
              <div className="text-center py-12">
                <TruckIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white">Aucune tournée</p>
                <p className="text-gray-500 dark:text-gray-400">Ce chauffeur n'a pas encore de tournées</p>
              </div>
            ) : (
              <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800/80">
                      <TableHead className="font-semibold dark:text-gray-200">Date</TableHead>
                      <TableHead className="font-semibold dark:text-gray-200">Matricule</TableHead>
                      <TableHead className="font-semibold dark:text-gray-200">Secteur</TableHead>
                      <TableHead className="text-center font-semibold dark:text-gray-200">Caisses</TableHead>
                      <TableHead className="font-semibold dark:text-gray-200">Statut</TableHead>
                      <TableHead className="text-center font-semibold dark:text-gray-200">Conflits</TableHead>
                      <TableHead className="text-center font-semibold dark:text-gray-200">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTours.map((tour) => {
                      const statusInfo = statusConfig[tour.statut] || statusConfig.PESEE_VIDE;
                      const StatusIcon = statusInfo.icon;
                      const caissesPerdues = tour.nbre_caisses_depart - (tour.nbre_caisses_retour || 0);
                      const hasConflicts = tour.conflicts.length > 0;
                      return (
                        <TableRow key={tour.id} className="dark:border-gray-700">
                          <TableCell className="text-gray-700 dark:text-gray-300">{format(new Date(tour.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}</TableCell>
                          <TableCell><MatriculeDisplay matricule={tour.matricule_vehicule} size="sm" /></TableCell>
                          <TableCell><div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-gray-400" /><span className="text-gray-700 dark:text-gray-300">{tour.secteur?.nom || "N/A"}</span></div></TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-gray-700 dark:text-gray-300">{tour.nbre_caisses_retour ?? "—"} / {tour.nbre_caisses_depart}</span>
                              {caissesPerdues > 0 && tour.nbre_caisses_retour !== null && <Badge variant="destructive" className="text-xs">-{caissesPerdues}</Badge>}
                            </div>
                          </TableCell>
                          <TableCell><Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-none`}><StatusIcon className="h-3 w-3 mr-1" />{statusInfo.label}</Badge></TableCell>
                          <TableCell className="text-center">{hasConflicts ? <Badge variant="destructive">{tour.conflicts.length}</Badge> : <span className="text-green-600">0</span>}</TableCell>
                          <TableCell className="text-center"><Button variant="ghost" size="sm" asChild><Link href={`/dashboard/tours/${tour.id}`}><Eye className="h-4 w-4" /></Link></Button></TableCell>
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
    </ScrollArea>
  );
}
