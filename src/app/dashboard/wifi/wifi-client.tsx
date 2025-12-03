"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Wifi,
  WifiOff,
  Trash2,
  Plus,
  Shield,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Lock,
  Unlock,
  Info,
} from "lucide-react";

interface WiFiConfig {
  id: string;
  ssid: string;
  bssid: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DetectedNetwork {
  ssid: string;
  bssid: string;
  signal: number;
}

export function WiFiClient() {
  const [configs, setConfigs] = useState<WiFiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [detectedNetworks, setDetectedNetworks] = useState<DetectedNetwork[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<DetectedNetwork | null>(null);
  const [wifiSecurityEnabled, setWifiSecurityEnabled] = useState(true);

  const [formData, setFormData] = useState({
    ssid: "",
    bssid: "",
    description: "",
  });

  const fetchConfigs = async () => {
    try {
      const response = await fetch("/api/wifi-config");
      const data = await response.json();

      if (response.ok) {
        setConfigs(data.configs || []);
      } else {
        setError(data.error || "Failed to fetch WiFi configurations");
      }
    } catch (err) {
      setError("Network error while fetching configurations");
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityStatus = async () => {
    try {
      const response = await fetch("/api/wifi-config/security-status");
      const data = await response.json();

      if (response.ok) {
        setWifiSecurityEnabled(data.enabled);
      }
    } catch (err) {
      console.error("Failed to fetch security status:", err);
    }
  };

  const toggleSecurityMode = async () => {
    setToggling(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/wifi-config/security-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !wifiSecurityEnabled }),
      });

      const data = await response.json();

      if (response.ok) {
        setWifiSecurityEnabled(data.enabled);
        setSuccess(
          data.enabled
            ? "✅ Sécurité WiFi activée - Restrictions appliquées"
            : "⚠️ Sécurité WiFi désactivée - Mode développement"
        );
      } else {
        setError(data.error || "Échec de la modification");
      }
    } catch (err) {
      setError("Erreur réseau lors de la modification");
    } finally {
      setToggling(false);
    }
  };

  const detectNetworks = async () => {
    setDetecting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/wifi-config/detect");
      const data = await response.json();

      if (response.ok) {
        setDetectedNetworks(data.networks || []);
        if (data.networks.length === 0) {
          setError(
            "Aucun réseau WiFi détecté. Assurez-vous d'être connecté à un réseau."
          );
        } else {
          setSuccess(`${data.networks.length} réseau(x) détecté(s)!`);
        }
      } else {
        setError(data.error || "Échec de la détection des réseaux");
      }
    } catch (err) {
      setError("Erreur lors de la détection des réseaux");
    } finally {
      setDetecting(false);
    }
  };

  const selectNetwork = (network: DetectedNetwork) => {
    setSelectedNetwork(network);
    setFormData({
      ssid: network.ssid,
      bssid: network.bssid,
      description: `Réseau détecté - Signal: ${network.signal}%`,
    });
  };

  useEffect(() => {
    fetchConfigs();
    fetchSecurityStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/wifi-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Configuration WiFi ajoutée avec succès!");
        setFormData({ ssid: "", bssid: "", description: "" });
        setSelectedNetwork(null);
        fetchConfigs();
      } else {
        setError(data.error || "Échec de l'ajout de la configuration");
      }
    } catch (err) {
      setError("Erreur réseau lors de l'ajout");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/wifi-config/toggle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });

      if (response.ok) {
        fetchConfigs();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to toggle WiFi configuration");
      }
    } catch (err) {
      setError("Network error while toggling configuration");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette configuration WiFi?")) {
      return;
    }

    try {
      const response = await fetch(`/api/wifi-config?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("Configuration WiFi supprimée");
        fetchConfigs();
      } else {
        const data = await response.json();
        setError(data.error || "Échec de la suppression");
      }
    } catch (err) {
      setError("Erreur réseau lors de la suppression");
    }
  };

  const activeCount = configs.filter((c) => c.isActive).length;

  if (loading) {
    return <div className="flex items-center justify-center py-12">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Security Toggle Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sécurité WiFi
              </CardTitle>
              <CardDescription>
                {wifiSecurityEnabled
                  ? "La sécurité WiFi est activée - Seuls les réseaux autorisés peuvent accéder"
                  : "Mode développement - Accès autorisé depuis tous les réseaux"}
              </CardDescription>
            </div>
            <Button
              onClick={toggleSecurityMode}
              disabled={toggling}
              variant={wifiSecurityEnabled ? "destructive" : "default"}
              className="gap-2"
            >
              {wifiSecurityEnabled ? (
                <>
                  <Unlock className="h-4 w-4" />
                  {toggling ? "Désactivation..." : "Désactiver"}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  {toggling ? "Activation..." : "Activer"}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Status Alert */}
      {!wifiSecurityEnabled ? (
        <Alert>
          <Unlock className="h-4 w-4" />
          <AlertDescription>
            🚧 <strong>Mode Développement:</strong> La sécurité WiFi est désactivée. L'application mobile
            fonctionne sur tous les réseaux.
          </AlertDescription>
        </Alert>
      ) : activeCount === 0 ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Aucune restriction WiFi active. L'application mobile fonctionne sur tous les réseaux.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            {activeCount} réseau{activeCount > 1 ? "x" : ""} WiFi autorisé{activeCount > 1 ? "s" : ""} pour
            l'accès mobile.
          </AlertDescription>
        </Alert>
      )}

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add WiFi Config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Ajouter un Réseau WiFi
            </CardTitle>
            <CardDescription>Détectez ou ajoutez manuellement un réseau</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={detectNetworks}
              disabled={detecting}
              className="w-full"
              variant="secondary"
            >
              {detecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Détection en cours...
                </>
              ) : (
                <>
                  <Wifi className="mr-2 h-4 w-4" />
                  Détecter les Réseaux WiFi
                </>
              )}
            </Button>

            {detectedNetworks.length > 0 && (
              <div className="space-y-2">
                <Label>Réseaux Détectés</Label>
                <ScrollArea className="h-48">
                  <div className="space-y-2 pr-4">
                    {detectedNetworks.map((network, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectNetwork(network)}
                        type="button"
                        className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                          selectedNetwork?.bssid === network.bssid
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold">{network.ssid}</p>
                            <p className="text-xs text-muted-foreground font-mono">{network.bssid}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{network.signal}%</Badge>
                            {selectedNetwork?.bssid === network.bssid && (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground mb-3">Ou saisissez manuellement:</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="ssid">SSID (Nom du WiFi)</Label>
                <Input
                  id="ssid"
                  value={formData.ssid}
                  onChange={(e) => setFormData({ ...formData, ssid: e.target.value })}
                  placeholder="Nom du réseau WiFi"
                  required
                  readOnly={!!selectedNetwork}
                />
              </div>

              <div>
                <Label htmlFor="bssid">BSSID (Adresse MAC)</Label>
                <Input
                  id="bssid"
                  value={formData.bssid}
                  onChange={(e) => setFormData({ ...formData, bssid: e.target.value })}
                  placeholder="XX:XX:XX:XX:XX:XX"
                  required
                  pattern="^([0-9A-Fa-f]{2}:){5}([0-9A-Fa-f]{2})$"
                  readOnly={!!selectedNetwork}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedNetwork ? "✓ Détecté automatiquement" : "Format: XX:XX:XX:XX:XX:XX"}
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description (optionnel)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: WiFi principal du bureau"
                />
              </div>

              <Button type="submit" disabled={submitting || !formData.ssid || !formData.bssid} className="w-full">
                {submitting ? "Ajout en cours..." : "Ajouter le Réseau"}
              </Button>

              {selectedNetwork && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedNetwork(null);
                    setFormData({ ssid: "", bssid: "", description: "" });
                  }}
                  className="w-full"
                >
                  Réinitialiser
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* WiFi Configs List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Réseaux Configurés
            </CardTitle>
            <CardDescription>
              {configs.length === 0
                ? "Aucun réseau configuré"
                : `${configs.length} réseau${configs.length > 1 ? "x" : ""} configuré${configs.length > 1 ? "s" : ""}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {configs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <WifiOff className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucun réseau WiFi configuré</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {configs.map((config) => (
                    <Card key={config.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{config.ssid}</h3>
                            <Badge variant={config.isActive ? "default" : "secondary"}>
                              {config.isActive ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground font-mono">{config.bssid}</p>
                          {config.description && <p className="text-sm mt-1">{config.description}</p>}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleToggle(config.id, config.isActive)}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          {config.isActive ? (
                            <>
                              <WifiOff className="mr-1 h-3 w-3" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <Wifi className="mr-1 h-3 w-3" />
                              Activer
                            </>
                          )}
                        </Button>

                        <Button onClick={() => handleDelete(config.id)} size="sm" variant="destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Comment ça marche ?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>🔐 Mode Sécurisé (Production) :</strong> Activez la sécurité pour restreindre l'accès mobile
            aux réseaux configurés uniquement.
          </p>
          <p>
            <strong>🔓 Mode Développement :</strong> Désactivez la sécurité pour permettre l'accès depuis
            n'importe quel réseau WiFi.
          </p>
          <p>
            <strong>✨ Détection Automatique :</strong> Cliquez sur "Détecter" pour voir tous vos réseaux WiFi
            disponibles.
          </p>
          <p>
            <strong>🔒 SSID + BSSID :</strong> Chaque réseau est identifié par son nom ET l'adresse MAC du routeur
            - impossible à usurper.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
