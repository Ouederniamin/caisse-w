"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  DollarSign,
  Package,
  TruckIcon,
  Bell,
  Shield,
  Save,
  RotateCcw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";

interface ConfigData {
  config: Record<string, string>;
  stock: {
    stock_initial: number;
    stock_actuel: number;
    seuil_alerte_pct: number;
    initialise: boolean;
  } | null;
  defaults: Record<string, string>;
}

interface ParametresClientProps {
  isAdmin: boolean;
  userRole: string;
}

export function ParametresClient({ isAdmin, userRole }: ParametresClientProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ConfigData | null>(null);
  const [formConfig, setFormConfig] = useState<Record<string, string>>({});
  const [formStock, setFormStock] = useState({ stock_initial: "", seuil_alerte_pct: "" });
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error("Erreur de chargement");
      const configData = await res.json();
      setData(configData);
      setFormConfig(configData.config || {});
      if (configData.stock) {
        setFormStock({
          stock_initial: configData.stock.stock_initial.toString(),
          seuil_alerte_pct: configData.stock.seuil_alerte_pct.toString(),
        });
      }
      setHasChanges(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: string, value: string) => {
    setFormConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSwitchChange = (key: string, checked: boolean) => {
    setFormConfig((prev) => ({ ...prev, [key]: checked ? "true" : "false" }));
    setHasChanges(true);
  };

  const handleStockChange = (key: string, value: string) => {
    setFormStock((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!isAdmin) {
      toast({
        title: "Accès refusé",
        description: "Seul l'administrateur peut modifier les paramètres",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: formConfig,
          stock: {
            stock_initial: formStock.stock_initial,
            seuil_alerte_pct: formStock.seuil_alerte_pct,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erreur de sauvegarde");
      }

      toast({
        title: "✅ Succès",
        description: "Configuration sauvegardée",
      });
      setHasChanges(false);
      loadConfig();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (data) {
      setFormConfig(data.defaults);
      setHasChanges(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl">
              <Settings className="h-8 w-8 text-white" />
            </div>
            Paramètres Système
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configuration et paramètres de l'application
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            {userRole}
          </Badge>
          {isAdmin ? (
            <Badge className="bg-green-500">Édition autorisée</Badge>
          ) : (
            <Badge variant="secondary">Lecture seule</Badge>
          )}
        </div>
      </div>

      {/* Save Bar */}
      {hasChanges && isAdmin && (
        <Card className="border-2 border-orange-300 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Vous avez des modifications non sauvegardées</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => loadConfig()} disabled={saving}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Sauvegarder
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="finance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="finance" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Finance
          </TabsTrigger>
          <TabsTrigger value="stock" className="gap-2">
            <Package className="h-4 w-4" />
            Stock
          </TabsTrigger>
          <TabsTrigger value="workflow" className="gap-2">
            <TruckIcon className="h-4 w-4" />
            Workflow
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Finance Tab */}
        <TabsContent value="finance">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Paramètres Financiers
              </CardTitle>
              <CardDescription>
                Configuration des valeurs monétaires et calculs de dette
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="prix_caisse" className="flex items-center gap-2">
                    Prix par caisse (TND)
                    <Badge variant="outline" className="text-xs">Important</Badge>
                  </Label>
                  <Input
                    id="prix_caisse"
                    type="number"
                    value={formConfig.PRIX_CAISSE_TND || ""}
                    onChange={(e) => handleConfigChange("PRIX_CAISSE_TND", e.target.value)}
                    disabled={!isAdmin}
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500">
                    Valeur utilisée pour calculer les dettes lors des pertes de caisses
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="multiplicateur_dette">Multiplicateur dette (TND/caisse)</Label>
                  <Input
                    id="multiplicateur_dette"
                    type="number"
                    value={formConfig.MONTANT_DETTE_MULTIPLIER || ""}
                    onChange={(e) => handleConfigChange("MONTANT_DETTE_MULTIPLIER", e.target.value)}
                    disabled={!isAdmin}
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500">
                    Montant à payer par caisse perdue
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tolerance_default">Tolérance par défaut (caisses)</Label>
                  <Input
                    id="tolerance_default"
                    type="number"
                    value={formConfig.TOLERANCE_CAISSES_DEFAULT || ""}
                    onChange={(e) => handleConfigChange("TOLERANCE_CAISSES_DEFAULT", e.target.value)}
                    disabled={!isAdmin}
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500">
                    Nombre de caisses tolérées avant création de conflit
                  </p>
                </div>

                <div className="space-y-2 flex flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto_calcul">Calcul automatique de la dette</Label>
                    <Switch
                      id="auto_calcul"
                      checked={formConfig.AUTO_CALCUL_DETTE === "true"}
                      onCheckedChange={(checked) => handleSwitchChange("AUTO_CALCUL_DETTE", checked)}
                      disabled={!isAdmin}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Calculer automatiquement le montant de la dette lors d'un conflit
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Tab */}
        <TabsContent value="stock">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Paramètres du Stock
              </CardTitle>
              <CardDescription>
                Configuration de la gestion du stock de caisses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {data?.stock && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-700 dark:text-blue-400">Stock initialisé</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Stock actuel:</span>
                      <span className="ml-2 font-bold text-lg">{data.stock.stock_actuel}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Stock initial:</span>
                      <span className="ml-2 font-bold">{data.stock.stock_initial}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="stock_initial">Stock initial de référence</Label>
                  <Input
                    id="stock_initial"
                    type="number"
                    value={formStock.stock_initial}
                    onChange={(e) => handleStockChange("stock_initial", e.target.value)}
                    disabled={!isAdmin}
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500">
                    Nombre total de caisses en circulation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seuil_alerte">Seuil d'alerte stock (%)</Label>
                  <Input
                    id="seuil_alerte"
                    type="number"
                    min="1"
                    max="50"
                    value={formStock.seuil_alerte_pct}
                    onChange={(e) => handleStockChange("seuil_alerte_pct", e.target.value)}
                    disabled={!isAdmin}
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500">
                    Alerte si le stock tombe en dessous de ce pourcentage
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TruckIcon className="h-5 w-5 text-purple-600" />
                Paramètres du Workflow
              </CardTitle>
              <CardDescription>
                Configuration du processus de tournée et matricules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="serie_matricule">Série matricule actuelle</Label>
                  <Input
                    id="serie_matricule"
                    type="text"
                    value={formConfig.SERIE_MATRICULE_ACTUELLE || ""}
                    onChange={(e) => handleConfigChange("SERIE_MATRICULE_ACTUELLE", e.target.value)}
                    disabled={!isAdmin}
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500">
                    Série utilisée pour les matricules tunisiens (ex: 253)
                  </p>
                </div>

                <div className="space-y-2 flex flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hygiene_enabled">Workflow hygiène (produits poulet)</Label>
                    <Switch
                      id="hygiene_enabled"
                      checked={formConfig.WORKFLOW_HYGIENE_ENABLED === "true"}
                      onCheckedChange={(checked) => handleSwitchChange("WORKFLOW_HYGIENE_ENABLED", checked)}
                      disabled={!isAdmin}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Activer la validation hygiène pour les tournées avec produits poulet
                  </p>
                </div>
              </div>

              <Separator />

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Statuts de tournée disponibles
                </h4>
                <div className="flex flex-wrap gap-2">
                  {["PESEE_VIDE", "EN_CHARGEMENT", "PRET_A_PARTIR", "EN_TOURNEE", "RETOUR", "EN_ATTENTE_DECHARGEMENT", "EN_ATTENTE_HYGIENE", "TERMINEE"].map((status) => (
                    <Badge key={status} variant="outline" className="font-mono text-xs">
                      {status}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-yellow-600" />
                Paramètres des Notifications
              </CardTitle>
              <CardDescription>
                Configuration des alertes et notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <Label>Notifications push (mobile)</Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Envoyer des notifications push via Expo
                      </p>
                    </div>
                    <Switch
                      checked={formConfig.NOTIFICATIONS_ENABLED === "true"}
                      onCheckedChange={(checked) => handleSwitchChange("NOTIFICATIONS_ENABLED", checked)}
                      disabled={!isAdmin}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <Label>Notifications par email</Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Envoyer des emails pour les alertes importantes
                      </p>
                    </div>
                    <Switch
                      checked={formConfig.EMAIL_NOTIFICATIONS === "true"}
                      onCheckedChange={(checked) => handleSwitchChange("EMAIL_NOTIFICATIONS", checked)}
                      disabled={!isAdmin}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <Label>Notifications SMS</Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Envoyer des SMS pour les alertes critiques
                      </p>
                    </div>
                    <Switch
                      checked={formConfig.SMS_NOTIFICATIONS === "true"}
                      onCheckedChange={(checked) => handleSwitchChange("SMS_NOTIFICATIONS", checked)}
                      disabled={!isAdmin}
                    />
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-700 dark:text-yellow-400">Bientôt disponible</span>
                  </div>
                  <p className="text-sm text-yellow-700/80 dark:text-yellow-400/80">
                    Les notifications email et SMS seront disponibles dans une prochaine mise à jour.
                    Les notifications push mobile sont fonctionnelles.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      {isAdmin && (
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Actions</h4>
                <p className="text-sm text-gray-500">Gérer les paramètres système</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleReset} disabled={saving}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser aux valeurs par défaut
                </Button>
                <Button onClick={handleSave} disabled={saving || !hasChanges} className="bg-blue-600 hover:bg-blue-700">
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Sauvegarder les modifications
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
