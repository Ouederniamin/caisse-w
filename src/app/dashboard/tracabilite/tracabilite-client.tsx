'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Package, TrendingDown, TrendingUp, ArrowLeftRight, Search, RefreshCw, Calendar, Filter } from 'lucide-react';
import Link from 'next/link';

interface Mouvement {
  id: string;
  type: string;
  quantite: number;
  solde_apres: number;
  notes: string | null;
  createdAt: string;
  tour: {
    id: string;
    matricule: string;
    driver: string;
    secteur: string;
    nbre_caisses_depart: number;
    nbre_caisses_retour: number | null;
    date_sortie: string | null;
  } | null;
  conflict: {
    id: string;
    quantite_perdue: number;
    montant_dette_tnd: number;
    statut: string;
  } | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface Perte {
  id: string;
  quantite: number;
  notes: string | null;
  createdAt: string;
  tour: {
    id: string;
    matricule: string;
    driver: string;
    driverId: string;
    secteur: string;
    nbre_caisses_depart: number;
    nbre_caisses_retour: number | null;
    date_sortie: string | null;
  } | null;
  conflict: {
    id: string;
    quantite_perdue: number;
    montant_dette_tnd: number;
    statut: string;
  } | null;
}

interface DriverSummary {
  id: string;
  nom: string;
  pertes: number;
  dette: number;
  count: number;
}

interface MouvementsResponse {
  mouvements: Mouvement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PertesResponse {
  pertes: Perte[];
  stats: {
    totalPertes: number;
    totalDette: number;
    totalIncidents: number;
  };
  driverSummary: DriverSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function TraceabilityClient() {
  const [activeTab, setActiveTab] = useState('mouvements');
  const [loading, setLoading] = useState(true);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [pertes, setPertes] = useState<Perte[]>([]);
  const [pertesStats, setPertesStats] = useState<PertesResponse['stats'] | null>(null);
  const [driverSummary, setDriverSummary] = useState<DriverSummary[]>([]);
  const [mouvementsPagination, setMouvementsPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [pertesPagination, setPertesPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchMouvements = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '25' });
      if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      
      const response = await fetch(`/api/mouvements?${params}`);
      if (response.ok) {
        const data: MouvementsResponse = await response.json();
        setMouvements(data.mouvements);
        setMouvementsPagination({
          page: data.pagination.page,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total,
        });
      }
    } catch (error) {
      console.error('Error fetching mouvements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPertes = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '25' });
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      
      const response = await fetch(`/api/pertes?${params}`);
      if (response.ok) {
        const data: PertesResponse = await response.json();
        setPertes(data.pertes);
        setPertesStats(data.stats);
        setDriverSummary(data.driverSummary);
        setPertesPagination({
          page: data.pagination.page,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total,
        });
      }
    } catch (error) {
      console.error('Error fetching pertes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'mouvements') {
      fetchMouvements();
    } else {
      fetchPertes();
    }
  }, [activeTab]);

  const handleSearch = () => {
    if (activeTab === 'mouvements') {
      fetchMouvements(1);
    } else {
      fetchPertes(1);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DEPART_TOURNEE':
        return <TrendingDown className="h-4 w-4 text-orange-500" />;
      case 'RETOUR_TOURNEE':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'PERTE_CONFIRMEE':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'SURPLUS':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'INITIALISATION':
        return <Package className="h-4 w-4 text-purple-500" />;
      case 'AJUSTEMENT':
        return <ArrowLeftRight className="h-4 w-4 text-gray-500" />;
      case 'ACHAT':
        return <Package className="h-4 w-4 text-green-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'DEPART_TOURNEE': 'secondary',
      'RETOUR_TOURNEE': 'default',
      'PERTE_CONFIRMEE': 'destructive',
      'SURPLUS': 'outline',
      'INITIALISATION': 'outline',
      'AJUSTEMENT': 'outline',
      'ACHAT': 'default',
    };
    
    const labels: Record<string, string> = {
      'DEPART_TOURNEE': 'Départ',
      'RETOUR_TOURNEE': 'Retour',
      'PERTE_CONFIRMEE': 'Perte',
      'SURPLUS': 'Surplus',
      'INITIALISATION': 'Init',
      'AJUSTEMENT': 'Ajust.',
      'ACHAT': 'Achat',
    };
    
    return (
      <Badge variant={variants[type] || 'outline'} className="gap-1">
        {getTypeIcon(type)}
        {labels[type] || type}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getConflictStatusBadge = (statut: string) => {
    switch (statut) {
      case 'EN_ATTENTE':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'PAYEE':
        return <Badge variant="default" className="bg-green-100 text-green-800">Payé</Badge>;
      case 'RESOLUE':
        return <Badge variant="default" className="bg-green-100 text-green-800">Résolu</Badge>;
      case 'ANNULE':
        return <Badge variant="outline">Annulé</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📦 Traçabilité Caisses</h1>
          <p className="text-muted-foreground">Suivi complet des mouvements de caisses et pertes</p>
        </div>
        <Button onClick={handleSearch} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="mouvements" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Tous les Mouvements
          </TabsTrigger>
          <TabsTrigger value="pertes" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Pertes (Bleeding)
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mt-4">
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4 items-end">
              {activeTab === 'mouvements' && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Type</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="DEPART_TOURNEE">Départ Tournée</SelectItem>
                      <SelectItem value="RETOUR_TOURNEE">Retour Tournée</SelectItem>
                      <SelectItem value="PERTE_CONFIRMEE">Perte Confirmée</SelectItem>
                      <SelectItem value="SURPLUS">Surplus</SelectItem>
                      <SelectItem value="INITIALISATION">Initialisation</SelectItem>
                      <SelectItem value="AJUSTEMENT">Ajustement</SelectItem>
                      <SelectItem value="ACHAT">Achat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Date début</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[160px]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Date fin</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[160px]"
                />
              </div>
              <Button onClick={handleSearch} className="gap-2">
                <Search className="h-4 w-4" />
                Rechercher
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setTypeFilter('all');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mouvements Tab */}
        <TabsContent value="mouvements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Mouvements</CardTitle>
              <CardDescription>
                {mouvementsPagination.total} mouvements enregistrés
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date/Heure</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Quantité</TableHead>
                        <TableHead className="text-right">Solde Après</TableHead>
                        <TableHead>Tournée</TableHead>
                        <TableHead>Chauffeur</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mouvements.map((m) => (
                        <TableRow key={m.id} className={m.type === 'PERTE_CONFIRMEE' ? 'bg-red-50' : ''}>
                          <TableCell className="font-mono text-sm">
                            {formatDate(m.createdAt)}
                          </TableCell>
                          <TableCell>{getTypeBadge(m.type)}</TableCell>
                          <TableCell className={`text-right font-bold ${m.quantite >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {m.quantite >= 0 ? '+' : ''}{m.quantite}
                          </TableCell>
                          <TableCell className="text-right font-mono">{m.solde_apres}</TableCell>
                          <TableCell>
                            {m.tour ? (
                              <Link href={`/dashboard/tours/${m.tour.id}`} className="text-blue-600 hover:underline">
                                {m.tour.matricule}
                              </Link>
                            ) : '-'}
                          </TableCell>
                          <TableCell>{m.tour?.driver || '-'}</TableCell>
                          <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                            {m.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {mouvementsPagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={mouvementsPagination.page === 1}
                        onClick={() => fetchMouvements(mouvementsPagination.page - 1)}
                      >
                        Précédent
                      </Button>
                      <span className="py-2 px-4 text-sm">
                        Page {mouvementsPagination.page} / {mouvementsPagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={mouvementsPagination.page === mouvementsPagination.totalPages}
                        onClick={() => fetchMouvements(mouvementsPagination.page + 1)}
                      >
                        Suivant
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pertes Tab */}
        <TabsContent value="pertes" className="space-y-4">
          {/* Stats Cards */}
          {pertesStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-red-50 border-red-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 rounded-full">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Caisses Perdues</p>
                      <p className="text-3xl font-bold text-red-600">{pertesStats.totalPertes}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 rounded-full">
                      <TrendingDown className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dette Totale</p>
                      <p className="text-3xl font-bold text-orange-600">{pertesStats.totalDette} TND</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <Package className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre d'Incidents</p>
                      <p className="text-3xl font-bold text-yellow-600">{pertesStats.totalIncidents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Driver Summary */}
          {driverSummary.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Classement des Pertes par Chauffeur
                </CardTitle>
                <CardDescription>Chauffeurs avec le plus de caisses manquantes</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Chauffeur</TableHead>
                      <TableHead className="text-right">Caisses Perdues</TableHead>
                      <TableHead className="text-right">Dette (TND)</TableHead>
                      <TableHead className="text-right">Incidents</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driverSummary.slice(0, 10).map((driver, index) => (
                      <TableRow key={driver.id} className={index === 0 ? 'bg-red-50' : ''}>
                        <TableCell className="font-bold">{index + 1}</TableCell>
                        <TableCell className="font-medium">{driver.nom}</TableCell>
                        <TableCell className="text-right font-bold text-red-600">{driver.pertes}</TableCell>
                        <TableCell className="text-right">{driver.dette.toFixed(2)} TND</TableCell>
                        <TableCell className="text-right">{driver.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Pertes List */}
          <Card>
            <CardHeader>
              <CardTitle>Détail des Pertes</CardTitle>
              <CardDescription>
                {pertesPagination.total} pertes enregistrées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date/Heure</TableHead>
                        <TableHead className="text-right">Caisses Perdues</TableHead>
                        <TableHead className="text-right">Dette</TableHead>
                        <TableHead>Tournée</TableHead>
                        <TableHead>Chauffeur</TableHead>
                        <TableHead>Secteur</TableHead>
                        <TableHead>Statut Conflit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pertes.map((p) => (
                        <TableRow key={p.id} className="bg-red-50">
                          <TableCell className="font-mono text-sm">
                            {formatDate(p.createdAt)}
                          </TableCell>
                          <TableCell className="text-right font-bold text-red-600">
                            -{p.quantite}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {p.conflict?.montant_dette_tnd.toFixed(2)} TND
                          </TableCell>
                          <TableCell>
                            {p.tour ? (
                              <Link href={`/dashboard/tours/${p.tour.id}`} className="text-blue-600 hover:underline">
                                {p.tour.matricule}
                              </Link>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="font-medium">{p.tour?.driver || '-'}</TableCell>
                          <TableCell>{p.tour?.secteur || '-'}</TableCell>
                          <TableCell>
                            {p.conflict ? (
                              <Link href={`/dashboard/conflits/${p.conflict.id}`}>
                                {getConflictStatusBadge(p.conflict.statut)}
                              </Link>
                            ) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {pertesPagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pertesPagination.page === 1}
                        onClick={() => fetchPertes(pertesPagination.page - 1)}
                      >
                        Précédent
                      </Button>
                      <span className="py-2 px-4 text-sm">
                        Page {pertesPagination.page} / {pertesPagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pertesPagination.page === pertesPagination.totalPages}
                        onClick={() => fetchPertes(pertesPagination.page + 1)}
                      >
                        Suivant
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
