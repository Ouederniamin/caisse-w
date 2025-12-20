"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  TruckIcon,
  Package,
  Activity,
  CheckCircle,
  AlertCircle,
  MapPin,
  User,
  Calendar,
  ArrowLeft,
  Clock,
  Scale,
  Camera,
  ShieldCheck,
  ClipboardCheck,
  AlertTriangle,
  FileText,
  ChevronRight,
  ImageIcon,
  XCircle,
  Leaf,
} from "lucide-react";
import MatriculeDisplay from "@/components/MatriculeDisplay";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type TourStatus = 
  | "PREPARATION"
  | "PRET_A_PARTIR"
  | "EN_TOURNEE"
  | "EN_ATTENTE_DECHARGEMENT"
  | "EN_ATTENTE_HYGIENE"
  | "TERMINEE";

type ConflictStatus = "EN_ATTENTE" | "PAYEE" | "ANNULE" | "RESOLUE";

interface Tour {
  id: string;
  statut: TourStatus;
  matricule_vehicule: string;
  nbre_caisses_depart: number;
  nbre_caisses_retour: number | null;
  poids_net_produits_depart: number;
  poids_brut_securite_sortie: number | null;
  poids_brut_securite_retour: number | null;
  poids_tare_securite: number | null;
  poids_net_total_calcule: number | null;
  photo_preuve_depart_url: string | null;
  photo_preuve_retour_url: string | null;
  photos_hygiene_urls: string[];
  notes_hygiene: string | null;
  statut_hygiene: string | null;
  matricule_verifie_sortie: boolean;
  matricule_verifie_retour: boolean;
  date_sortie_securite: Date | string | null;
  date_entree_securite: Date | string | null;
  date_sortie_finale: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  driver: {
    id: string;
    nom_complet: string;
    matricule_par_defaut: string | null;
  } | null;
  secteur: {
    id: string;
    nom: string;
  } | null;
  agentControle: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  } | null;
  agentHygiene: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  } | null;
  securiteSortie: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  } | null;
  securiteEntree: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  } | null;
  lignesRetour: {
    id: string;
    nbre_caisses: number;
    poids_brut_retour: number;
    poids_net_retour: number;
    note_etat: string | null;
    produit: {
      id: string;
      code_article: string;
      nom: string;
    };
  }[];
  conflicts: {
    id: string;
    quantite_perdue: number;
    montant_dette_tnd: number;
    statut: ConflictStatus;
    notes_direction: string | null;
    depasse_tolerance: boolean;
    createdAt: Date | string;
  }[];
}

interface TourDetailClientProps {
  tour: Tour;
}

// Timeline step component
function TimelineStep({ 
  title, 
  description, 
  isActive, 
  isCompleted, 
  icon: Icon, 
  details 
}: { 
  title: string; 
  description?: string | null;
  isActive: boolean;
  isCompleted: boolean;
  icon: React.ElementType;
  details?: React.ReactNode;
}) {
  return (
    <div className={`relative flex gap-4 pb-8 last:pb-0 ${isCompleted || isActive ? 'opacity-100' : 'opacity-50'}`}>
      {/* Line */}
      <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 last:hidden" />
      
      {/* Icon */}
      <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
        isActive 
          ? 'bg-blue-500 text-white ring-4 ring-blue-500/20' 
          : isCompleted 
            ? 'bg-green-500 text-white' 
            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
      }`}>
        <Icon className="h-5 w-5" />
      </div>
      
      {/* Content */}
      <div className="flex-1 pt-1.5">
        <h4 className={`font-semibold ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
          {title}
        </h4>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {description}
          </p>
        )}
        {details && (
          <div className="mt-2">
            {details}
          </div>
        )}
      </div>
    </div>
  );
}

// Photo viewer component
function PhotoViewer({ url, alt }: { url: string; alt: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Construct the full URL for the image
  // Handle: absolute URLs (http/https), base64 data URLs, and relative paths
  const imageUrl = url.startsWith('http') || url.startsWith('data:') 
    ? url 
    : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}${url}`;
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="relative aspect-video w-full max-w-xs cursor-pointer overflow-hidden rounded-lg border dark:border-gray-700 hover:ring-2 hover:ring-blue-500 transition-all">
          <Image
            src={imageUrl}
            alt={alt}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity drop-shadow-lg" />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0">
        <div className="relative aspect-video w-full">
          <Image
            src={imageUrl}
            alt={alt}
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TourDetailClient({ tour }: TourDetailClientProps) {
  const statusConfig = useMemo(() => ({
    PREPARATION: {
      label: "Préparation",
      color: "text-gray-700 dark:text-gray-300",
      bgColor: "bg-gray-100 dark:bg-gray-700",
      badgeColor: "bg-gray-500",
      icon: Package,
    },
    PRET_A_PARTIR: {
      label: "Prêt à partir",
      color: "text-blue-700 dark:text-blue-300",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      badgeColor: "bg-blue-500",
      icon: TruckIcon,
    },
    EN_TOURNEE: {
      label: "En tournée",
      color: "text-purple-700 dark:text-purple-300",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      badgeColor: "bg-purple-500",
      icon: Activity,
    },
    EN_ATTENTE_DECHARGEMENT: {
      label: "Attente déchargement",
      color: "text-orange-700 dark:text-orange-300",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      badgeColor: "bg-orange-500",
      icon: Package,
    },
    EN_ATTENTE_HYGIENE: {
      label: "Attente hygiène",
      color: "text-yellow-700 dark:text-yellow-300",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      badgeColor: "bg-yellow-500",
      icon: AlertCircle,
    },
    TERMINEE: {
      label: "Terminée",
      color: "text-green-700 dark:text-green-300",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      badgeColor: "bg-green-500",
      icon: CheckCircle,
    },
  }), []);

  const conflictStatusConfig: Record<ConflictStatus, { label: string; color: string }> = {
    EN_ATTENTE: { label: "En attente", color: "bg-yellow-500" },
    PAYEE: { label: "Payée", color: "bg-green-500" },
    ANNULE: { label: "Annulé", color: "bg-gray-500" },
    RESOLUE: { label: "Résolu", color: "bg-green-500" },
  };

  const config = statusConfig[tour.statut];
  const Icon = config?.icon || Package;
  
  const caisseDifference = tour.nbre_caisses_retour !== null 
    ? tour.nbre_caisses_depart - tour.nbre_caisses_retour 
    : null;

  // Determine timeline steps completion
  const steps = [
    { 
      key: 'preparation',
      title: 'Préparation',
      statuses: ['PREPARATION'],
    },
    { 
      key: 'ready',
      title: 'Prêt à partir',
      statuses: ['PRET_A_PARTIR'],
    },
    { 
      key: 'tournee',
      title: 'En tournée',
      statuses: ['EN_TOURNEE'],
    },
    { 
      key: 'dechargement',
      title: 'Déchargement',
      statuses: ['EN_ATTENTE_DECHARGEMENT'],
    },
    { 
      key: 'hygiene',
      title: 'Contrôle hygiène',
      statuses: ['EN_ATTENTE_HYGIENE'],
    },
    { 
      key: 'terminee',
      title: 'Terminée',
      statuses: ['TERMINEE'],
    },
  ];

  const currentStepIndex = steps.findIndex(s => s.statuses.includes(tour.statut));

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 md:p-6 space-y-6">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-2">
          <Link href="/dashboard/tours">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux tournées
          </Link>
        </Button>

        {/* Header Card */}
        <Card className="border-none shadow-lg dark:bg-gray-800/50">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left side - Vehicle & Driver Info */}
              <div className="flex items-center gap-6">
                <MatriculeDisplay matricule={tour.matricule_vehicule} size="lg" />
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={`${config?.bgColor} ${config?.color} border-none text-sm px-3 py-1`}>
                      <Icon className="h-4 w-4 mr-1.5" />
                      {config?.label}
                    </Badge>
                    {tour.conflicts.length > 0 && (
                      <Badge variant="destructive" className="text-sm px-3 py-1">
                        <AlertTriangle className="h-4 w-4 mr-1.5" />
                        {tour.conflicts.length} conflit{tour.conflicts.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {tour.driver?.nom_complet || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>{tour.secteur?.nom || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Date */}
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Calendar className="h-5 w-5" />
                <span className="text-lg">
                  {format(new Date(tour.createdAt), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Caisses Départ */}
          <Card className="border-none shadow-md dark:bg-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Caisses Départ
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {tour.nbre_caisses_depart}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Caisses Retour */}
          <Card className="border-none shadow-md dark:bg-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Caisses Retour
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {tour.nbre_caisses_retour ?? "—"}
                    </p>
                    {caisseDifference !== null && caisseDifference !== 0 && (
                      <Badge variant={caisseDifference > 0 ? "destructive" : "default"} className={caisseDifference < 0 ? "bg-purple-500" : ""}>
                        {caisseDifference > 0 ? `-${caisseDifference}` : `+${Math.abs(caisseDifference)}`}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className={`p-2 rounded-lg ${caisseDifference && caisseDifference > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                  <Package className={`h-5 w-5 ${caisseDifference && caisseDifference > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Poids Net Départ */}
          <Card className="border-none shadow-md dark:bg-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Poids Net Départ
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {tour.poids_net_produits_depart} <span className="text-sm font-normal text-gray-500">kg</span>
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Scale className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Poids Net Calculé */}
          <Card className="border-none shadow-md dark:bg-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Poids Net Calculé
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {tour.poids_net_total_calcule ? `${tour.poids_net_total_calcule}` : "—"} 
                    {tour.poids_net_total_calcule && <span className="text-sm font-normal text-gray-500">kg</span>}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Scale className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Timeline */}
          <Card className="border-none shadow-lg dark:bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Progression
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Étapes de la tournée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                <TimelineStep
                  title="Préparation"
                  description={format(new Date(tour.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                  isActive={tour.statut === 'PREPARATION'}
                  isCompleted={currentStepIndex > 0}
                  icon={ClipboardCheck}
                  details={
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>Agent: {tour.agentControle?.name || tour.agentControle?.email || 'N/A'}</p>
                      <p>{tour.nbre_caisses_depart} caisses • {tour.poids_net_produits_depart} kg</p>
                    </div>
                  }
                />

                <TimelineStep
                  title="Pesée Sortie"
                  description={tour.date_sortie_securite 
                    ? format(new Date(tour.date_sortie_securite), "dd/MM/yyyy HH:mm", { locale: fr })
                    : null
                  }
                  isActive={tour.statut === 'PRET_A_PARTIR'}
                  isCompleted={currentStepIndex > 1}
                  icon={Scale}
                  details={tour.poids_brut_securite_sortie && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>Poids brut: {tour.poids_brut_securite_sortie} kg</p>
                      {tour.securiteSortie && <p>Agent: {tour.securiteSortie.name || tour.securiteSortie.email}</p>}
                      {tour.matricule_verifie_sortie && (
                        <Badge variant="outline" className="mt-1 text-green-600 dark:text-green-400 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Matricule vérifié
                        </Badge>
                      )}
                    </div>
                  )}
                />

                <TimelineStep
                  title="En Tournée"
                  description={null}
                  isActive={tour.statut === 'EN_TOURNEE'}
                  isCompleted={currentStepIndex > 2}
                  icon={TruckIcon}
                />

                <TimelineStep
                  title="Pesée Retour"
                  description={tour.date_entree_securite 
                    ? format(new Date(tour.date_entree_securite), "dd/MM/yyyy HH:mm", { locale: fr })
                    : null
                  }
                  isActive={tour.statut === 'EN_ATTENTE_DECHARGEMENT'}
                  isCompleted={currentStepIndex > 3}
                  icon={Scale}
                  details={(tour.poids_brut_securite_retour || tour.poids_tare_securite) && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {tour.poids_brut_securite_retour && <p>Poids brut: {tour.poids_brut_securite_retour} kg</p>}
                      {tour.poids_tare_securite && <p>Poids tare: {tour.poids_tare_securite} kg</p>}
                      {tour.poids_net_total_calcule && <p>Poids net: {tour.poids_net_total_calcule} kg</p>}
                      {tour.securiteEntree && <p>Agent: {tour.securiteEntree.name || tour.securiteEntree.email}</p>}
                    </div>
                  )}
                />

                <TimelineStep
                  title="Contrôle Hygiène"
                  description={null}
                  isActive={tour.statut === 'EN_ATTENTE_HYGIENE'}
                  isCompleted={tour.statut === 'TERMINEE' && tour.agentHygiene !== null}
                  icon={Leaf}
                  details={tour.agentHygiene && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>Agent: {tour.agentHygiene.name || tour.agentHygiene.email}</p>
                      {tour.statut_hygiene && (
                        <Badge 
                          variant="outline" 
                          className={`mt-1 ${tour.statut_hygiene === 'APPROUVE' 
                            ? 'text-green-600 dark:text-green-400 border-green-300' 
                            : 'text-red-600 dark:text-red-400 border-red-300'
                          }`}
                        >
                          {tour.statut_hygiene === 'APPROUVE' ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                          {tour.statut_hygiene}
                        </Badge>
                      )}
                    </div>
                  )}
                />

                <TimelineStep
                  title="Terminée"
                  description={tour.statut === 'TERMINEE' 
                    ? format(new Date(tour.updatedAt), "dd/MM/yyyy HH:mm", { locale: fr })
                    : null
                  }
                  isActive={tour.statut === 'TERMINEE'}
                  isCompleted={tour.statut === 'TERMINEE'}
                  icon={CheckCircle}
                />
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photos Section */}
            <Card className="border-none shadow-lg dark:bg-gray-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Photos de Preuve
                </CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Photos prises lors des différentes étapes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Photo Départ */}
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      📦 Photo Départ
                    </p>
                    {tour.photo_preuve_depart_url ? (
                      <PhotoViewer url={tour.photo_preuve_depart_url} alt="Photo départ" />
                    ) : (
                      <div className="aspect-video w-full max-w-xs flex items-center justify-center rounded-lg border border-dashed dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div className="text-center text-gray-400">
                          <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">Aucune photo</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Photo Retour */}
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      🔙 Photo Retour
                    </p>
                    {tour.photo_preuve_retour_url ? (
                      <PhotoViewer url={tour.photo_preuve_retour_url} alt="Photo retour" />
                    ) : (
                      <div className="aspect-video w-full max-w-xs flex items-center justify-center rounded-lg border border-dashed dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div className="text-center text-gray-400">
                          <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">Aucune photo</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Photos Hygiène */}
                  {tour.photos_hygiene_urls.length > 0 && tour.photos_hygiene_urls.map((url, index) => (
                    <div key={`hygiene-${index}`}>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        🧹 Photo Hygiène {index + 1}
                      </p>
                      <PhotoViewer url={url} alt={`Photo hygiène ${index + 1}`} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Conflicts Section */}
            {tour.conflicts.length > 0 && (
              <Card className="border-none shadow-lg dark:bg-gray-800/50 border-l-4 border-l-red-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    Conflits ({tour.conflicts.length})
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Caisses manquantes et dettes associées
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-800/80">
                          <TableHead className="font-semibold dark:text-gray-200">Quantité Perdue</TableHead>
                          <TableHead className="font-semibold dark:text-gray-200">Montant Dette</TableHead>
                          <TableHead className="font-semibold dark:text-gray-200">Statut</TableHead>
                          <TableHead className="font-semibold dark:text-gray-200">Tolérance</TableHead>
                          <TableHead className="font-semibold dark:text-gray-200">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tour.conflicts.map((conflict) => (
                          <TableRow key={conflict.id} className="dark:border-gray-700">
                            <TableCell>
                              <Badge variant="destructive">
                                -{conflict.quantite_perdue} caisses
                              </Badge>
                            </TableCell>
                            <TableCell className="font-bold text-red-600 dark:text-red-400">
                              {conflict.montant_dette_tnd.toFixed(2)} TND
                            </TableCell>
                            <TableCell>
                              <Badge className={`${conflictStatusConfig[conflict.statut].color} text-white`}>
                                {conflictStatusConfig[conflict.statut].label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {conflict.depasse_tolerance ? (
                                <Badge variant="destructive">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Dépassée
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-300">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  OK
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-400">
                              {format(new Date(conflict.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {tour.conflicts.some(c => c.notes_direction) && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Notes Direction:
                      </p>
                      {tour.conflicts.filter(c => c.notes_direction).map((c) => (
                        <p key={c.id} className="text-sm text-gray-600 dark:text-gray-400">
                          {c.notes_direction}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Returned Products Section */}
            {tour.lignesRetour.length > 0 && (
              <Card className="border-none shadow-lg dark:bg-gray-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Produits Retournés ({tour.lignesRetour.length})
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Détails des produits retournés lors de cette tournée
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-800/80">
                          <TableHead className="font-semibold dark:text-gray-200">Produit</TableHead>
                          <TableHead className="font-semibold dark:text-gray-200">Code Article</TableHead>
                          <TableHead className="text-center font-semibold dark:text-gray-200">Caisses</TableHead>
                          <TableHead className="text-center font-semibold dark:text-gray-200">Poids Brut</TableHead>
                          <TableHead className="text-center font-semibold dark:text-gray-200">Poids Net</TableHead>
                          <TableHead className="font-semibold dark:text-gray-200">État</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tour.lignesRetour.map((ligne) => (
                          <TableRow key={ligne.id} className="dark:border-gray-700">
                            <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                              {ligne.produit.nom}
                            </TableCell>
                            <TableCell className="font-mono text-gray-600 dark:text-gray-400">
                              {ligne.produit.code_article}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="dark:border-gray-600">
                                {ligne.nbre_caisses}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-gray-700 dark:text-gray-300">
                              {ligne.poids_brut_retour} kg
                            </TableCell>
                            <TableCell className="text-center text-gray-700 dark:text-gray-300">
                              {ligne.poids_net_retour} kg
                            </TableCell>
                            <TableCell>
                              {ligne.note_etat ? (
                                <Badge variant="secondary" className="dark:bg-gray-700">
                                  {ligne.note_etat}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Hygiene Notes */}
            {tour.notes_hygiene && (
              <Card className="border-none shadow-lg dark:bg-gray-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Notes Hygiène
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {tour.notes_hygiene}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Agents Info */}
            <Card className="border-none shadow-lg dark:bg-gray-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Agents Impliqués
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Agent Contrôle */}
                  {tour.agentControle && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <ClipboardCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Agent Contrôle</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {tour.agentControle.name || tour.agentControle.email}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Agent Hygiène */}
                  {tour.agentHygiene && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Agent Hygiène</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {tour.agentHygiene.name || tour.agentHygiene.email}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Sécurité Sortie */}
                  {tour.securiteSortie && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                        <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sécurité Sortie</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {tour.securiteSortie.name || tour.securiteSortie.email}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Sécurité Entrée */}
                  {tour.securiteEntree && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                        <ShieldCheck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sécurité Entrée</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {tour.securiteEntree.name || tour.securiteEntree.email}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Poids Details */}
            <Card className="border-none shadow-lg dark:bg-gray-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Détails des Pesées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Poids Net Départ
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {tour.poids_net_produits_depart} <span className="text-sm font-normal text-gray-500">kg</span>
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Poids Brut Sortie
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {tour.poids_brut_securite_sortie ?? "—"} {tour.poids_brut_securite_sortie && <span className="text-sm font-normal text-gray-500">kg</span>}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Poids Brut Retour
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {tour.poids_brut_securite_retour ?? "—"} {tour.poids_brut_securite_retour && <span className="text-sm font-normal text-gray-500">kg</span>}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Tare Véhicule
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {tour.poids_tare_securite ?? "—"} {tour.poids_tare_securite && <span className="text-sm font-normal text-gray-500">kg</span>}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
