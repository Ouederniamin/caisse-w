"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Search, Plus, Trash2, TruckIcon, Calendar, Shield, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import MatriculeInput from "@/components/MatriculeInput";
import MatriculeDisplay from "@/components/MatriculeDisplay";

interface Driver {
  id: string;
  nom_complet: string;
  matricule_par_defaut: string | null;
  poids_tare_vehicule: number | null;
  tolerance_caisses_mensuelle: number;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    tours: number;
  };
}

interface ChauffeursClientProps {
  drivers: Driver[];
}

// Normalizes and formats the matricule consistently as: NNN تونس NNNN
// Ensures visual order remains even with mixed LTR/RTL content by using unicode-bidi isolation.
function formatMatricule(raw: string | null | undefined): string | null {
  if (!raw) return null;

  // Remove the Arabic word if already present at either end to prevent duplication
  const cleaned = raw.replace(/تونس/g, "");

  // Extract digits only
  const digits = cleaned.replace(/[^0-9]/g, "");
  if (digits.length < 7) return raw; // Not enough digits to reliably format

  const first = digits.slice(0, 3);
  const last = digits.slice(-4);

  // Use LRM marks to help keep ordering: \u200E (Left-to-Right Mark)
  const LRM = '\u200E';
  return `${LRM}${first} ${LRM}تونس ${LRM}${last}${LRM}`;
}

export function ChauffeursClient({ drivers }: ChauffeursClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newDriver, setNewDriver] = useState({
    nom_complet: "",
    matricule_par_defaut: "",
    poids_tare_vehicule: "",
    tolerance_caisses_mensuelle: 0,
  });

  const filteredDrivers = useMemo(() => {
    if (!searchQuery) return drivers;

    const query = searchQuery.toLowerCase();
    return drivers.filter(
      (driver) =>
        driver.nom_complet.toLowerCase().includes(query) ||
        driver.matricule_par_defaut?.toLowerCase().includes(query)
    );
  }, [drivers, searchQuery]);

  const stats = useMemo(() => {
    const totalDrivers = drivers.length;
    const driversWithMatricule = drivers.filter((d) => d.matricule_par_defaut).length;
    const totalTours = drivers.reduce((sum, d) => sum + d._count.tours, 0);
    const avgToursPerDriver = totalDrivers > 0 ? (totalTours / totalDrivers).toFixed(1) : "0";

    return [
      {
        label: "Total Chauffeurs",
        value: totalDrivers,
        icon: Users,
        color: "bg-blue-500",
      },
      {
        label: "Avec Matricule",
        value: driversWithMatricule,
        icon: Shield,
        color: "bg-green-500",
      },
      {
        label: "Total Tournées",
        value: totalTours,
        icon: TruckIcon,
        color: "bg-purple-500",
      },
      {
        label: "Moy. Tournées/Chauffeur",
        value: avgToursPerDriver,
        icon: Calendar,
        color: "bg-orange-500",
      },
    ];
  }, [drivers]);

  const handleAddDriver = async () => {
    if (!newDriver.nom_complet.trim()) {
      setError("Le nom complet est requis");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        ...newDriver,
        poids_tare_vehicule: newDriver.poids_tare_vehicule ? parseFloat(newDriver.poids_tare_vehicule) : null,
      };
      const response = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de l'ajout");
      }

      setIsAddDialogOpen(false);
      setNewDriver({
        nom_complet: "",
        matricule_par_defaut: "",
        poids_tare_vehicule: "",
        tolerance_caisses_mensuelle: 0,
      });
      window.location.reload();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDriver = async (id: string, hasTours: boolean) => {
    if (hasTours) {
      alert("Impossible de supprimer un chauffeur avec des tourn\u00e9es existantes");
      return;
    }

    if (!confirm("Êtes-vous sûr de vouloir supprimer ce chauffeur ?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/drivers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Chauffeurs</h1>
          <p className="text-muted-foreground">
            Gérez les chauffeurs et leurs informations
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter Chauffeur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un Nouveau Chauffeur</DialogTitle>
              <DialogDescription>
                Remplissez les informations du chauffeur
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="nom_complet">Nom Complet *</Label>
                <Input
                  id="nom_complet"
                  placeholder="Ex: Mohamed Ben Ali"
                  value={newDriver.nom_complet}
                  onChange={(e) =>
                    setNewDriver({ ...newDriver, nom_complet: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="matricule">Matricule (Optionnel)</Label>
                <MatriculeInput
                  value={newDriver.matricule_par_defaut}
                  onChange={(value) =>
                    setNewDriver({
                      ...newDriver,
                      matricule_par_defaut: value,
                    })
                  }
                  placeholder="Saisissez le matricule"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="poids_tare">Poids Tare Véhicule (kg)</Label>
                <Input
                  id="poids_tare"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 3500"
                  value={newDriver.poids_tare_vehicule}
                  onChange={(e) =>
                    setNewDriver({
                      ...newDriver,
                      poids_tare_vehicule: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Poids à vide du véhicule pour validation des pesées
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tolerance">Tolérance Caisses Mensuelle</Label>
                <Input
                  id="tolerance"
                  type="number"
                  min="0"
                  value={newDriver.tolerance_caisses_mensuelle}
                  onChange={(e) =>
                    setNewDriver({
                      ...newDriver,
                      tolerance_caisses_mensuelle: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setError(null);
                }}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button onClick={handleAddDriver} disabled={isLoading}>
                {isLoading ? "Ajout en cours..." : "Ajouter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Chauffeurs</CardTitle>
          <CardDescription>
            {filteredDrivers.length} chauffeur(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou matricule..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom Complet</TableHead>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Poids Tare</TableHead>
                  <TableHead>Tolérance</TableHead>
                  <TableHead>Tournées</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      Aucun chauffeur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDrivers.map((driver) => (
                    <TableRow key={driver.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Link 
                          href={`/dashboard/chauffeurs/${driver.id}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                        >
                          {driver.nom_complet}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {driver.matricule_par_defaut ? (
                          <MatriculeDisplay
                            matricule={driver.matricule_par_defaut}
                            size="sm"
                          />
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Non défini
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {driver.poids_tare_vehicule ? (
                          <Badge variant="outline">
                            {driver.poids_tare_vehicule.toLocaleString()} kg
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {driver.tolerance_caisses_mensuelle} caisses
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TruckIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{driver._count.tours}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={driver._count.tours > 0 || isLoading}
                          onClick={() => handleDeleteDriver(driver.id, driver._count.tours > 0)}
                          title={driver._count.tours > 0 ? "Impossible de supprimer - a des tourn\u00e9es" : "Supprimer"}
                        >
                          <Trash2 className={`h-4 w-4 ${
                            driver._count.tours > 0 ? "text-gray-400" : "text-red-600"
                          }`} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
