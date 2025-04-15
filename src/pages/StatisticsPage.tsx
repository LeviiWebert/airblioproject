
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2, AlertCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const StatisticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsByStatus, setStatsByStatus] = useState<any[]>([]);
  const [statsByUrgency, setStatsByUrgency] = useState<any[]>([]);
  const [statsByMonth, setStatsByMonth] = useState<any[]>([]);
  const [equipmentStats, setEquipmentStats] = useState<any[]>([]);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Statistiques par statut
      const { data: statusData, error: statusError } = await supabase
        .from('interventions')
        .select('statut, count')
        .select('statut');
      
      if (statusError) throw statusError;
      
      const statusCounts: Record<string, number> = {};
      statusData.forEach(item => {
        const status = item.statut || 'non_défini';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      const formattedStatusStats = Object.entries(statusCounts).map(([name, value]) => ({
        name: formatStatus(name),
        value
      }));
      
      setStatsByStatus(formattedStatusStats);
      
      // 2. Statistiques par niveau d'urgence
      const { data: urgencyData, error: urgencyError } = await supabase
        .from('demande_interventions')
        .select('urgence');
      
      if (urgencyError) throw urgencyError;
      
      const urgencyCounts: Record<string, number> = {};
      urgencyData.forEach(item => {
        const urgency = item.urgence || 'non_défini';
        urgencyCounts[urgency] = (urgencyCounts[urgency] || 0) + 1;
      });
      
      const formattedUrgencyStats = Object.entries(urgencyCounts).map(([name, value]) => ({
        name: formatUrgency(name),
        value
      }));
      
      setStatsByUrgency(formattedUrgencyStats);
      
      // 3. Statistiques par mois
      const monthsData = [];
      const currentDate = new Date();
      
      for (let i = 0; i < 6; i++) {
        const monthDate = subMonths(currentDate, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        
        const { data: monthData, error: monthError } = await supabase
          .from('interventions')
          .select('count')
          .gte('date_debut', monthStart.toISOString())
          .lte('date_debut', monthEnd.toISOString());
        
        if (monthError) throw monthError;
        
        monthsData.unshift({
          name: format(monthDate, 'MMM yyyy', { locale: fr }),
          count: monthData.length
        });
      }
      
      setStatsByMonth(monthsData);
      
      // 4. Statistiques du matériel
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('materiels')
        .select('etat');
      
      if (equipmentError) throw equipmentError;
      
      const equipmentCounts: Record<string, number> = {};
      equipmentData.forEach(item => {
        const status = item.etat || 'non_défini';
        equipmentCounts[status] = (equipmentCounts[status] || 0) + 1;
      });
      
      const formattedEquipmentStats = Object.entries(equipmentCounts).map(([name, value]) => ({
        name: formatEquipmentStatus(name),
        value
      }));
      
      setEquipmentStats(formattedEquipmentStats);
      
    } catch (error: any) {
      console.error("Erreur lors du chargement des statistiques:", error);
      setError("Impossible de charger les statistiques. " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'en_attente': 'En attente',
      'validée': 'Validée',
      'planifiée': 'Planifiée',
      'en_cours': 'En cours',
      'terminée': 'Terminée',
      'annulée': 'Annulée',
      'non_défini': 'Non défini'
    };
    return statusMap[status] || status;
  };

  const formatUrgency = (urgency: string): string => {
    const urgencyMap: Record<string, string> = {
      'basse': 'Basse',
      'moyenne': 'Moyenne',
      'haute': 'Haute',
      'critique': 'Critique',
      'non_défini': 'Non défini'
    };
    return urgencyMap[urgency] || urgency;
  };

  const formatEquipmentStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'disponible': 'Disponible',
      'en utilisation': 'En utilisation',
      'en maintenance': 'En maintenance',
      'hors service': 'Hors service',
      'non_défini': 'Non défini'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border p-8 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Erreur de chargement</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Statistiques</h1>
        <p className="text-muted-foreground">
          Visualisez les données clés sur les interventions et le matériel.
        </p>
      </div>
      
      <Tabs defaultValue="interventions">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
          <TabsTrigger value="equipment">Matériel</TabsTrigger>
        </TabsList>
        
        <TabsContent value="interventions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Interventions par statut</CardTitle>
                <CardDescription>
                  Répartition des interventions selon leur statut actuel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statsByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {statsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Interventions par niveau d'urgence</CardTitle>
                <CardDescription>
                  Répartition des demandes selon leur niveau d'urgence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statsByUrgency}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {statsByUrgency.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Évolution mensuelle des interventions</CardTitle>
              <CardDescription>
                Nombre d'interventions créées par mois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={statsByMonth}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Nombre d'interventions" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="equipment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>État du matériel</CardTitle>
              <CardDescription>
                Répartition du matériel selon son état actuel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={equipmentStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {equipmentStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StatisticsPage;
