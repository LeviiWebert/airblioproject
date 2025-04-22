
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import WorldMap from "@/components/maps/WorldMap";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const WorldMapPage = () => {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<any[]>([]);
  const [stats, setStats] = useState({
    equipment: 0,
    teams: 0,
    updatedAt: new Date()
  });
  const { toast } = useToast();

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const [equipmentResponse, teamsResponse] = await Promise.all([
        supabase
          .from('suivi_materiels')
          .select(`
            *,
            materiel:materiel_id (
              reference,
              type_materiel
            )
          `)
          .order('created_at', { ascending: false })
          .limit(1000),
        supabase
          .from('suivi_equipes')
          .select(`
            *,
            equipe:equipe_id (
              nom,
              specialisation
            )
          `)
          .order('created_at', { ascending: false })
          .limit(1000)
      ]);

      if (equipmentResponse.error) throw equipmentResponse.error;
      if (teamsResponse.error) throw teamsResponse.error;

      const equipmentLocations = (equipmentResponse.data || []).map(item => ({
        id: item.id,
        type: 'equipment' as const,
        name: item.materiel?.reference || 'Matériel sans référence',
        latitude: item.latitude || 48.8566,
        longitude: item.longitude || 2.3522,
        details: `Type: ${item.materiel?.type_materiel || 'Non spécifié'}<br/>État: ${item.etat_apres || 'Non spécifié'}`
      }));

      const teamLocations = (teamsResponse.data || []).map(item => ({
        id: item.id,
        type: 'team' as const,
        name: item.equipe?.nom || 'Équipe sans nom',
        latitude: item.latitude || 48.8566,
        longitude: item.longitude || 2.3522,
        details: `Spécialisation: ${item.equipe?.specialisation || 'Non spécifiée'}<br/>Rôle: ${item.role_equipe || 'Non spécifié'}`
      }));

      const combinedLocations = [...equipmentLocations, ...teamLocations];
      
      setLocations(combinedLocations);
      setStats({
        equipment: equipmentLocations.length,
        teams: teamLocations.length,
        updatedAt: new Date()
      });

      if (loading) {
        toast({
          title: "Carte chargée avec succès",
          description: `${combinedLocations.length} localisations affichées sur la carte.`,
        });
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement des données:", error);
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de charger les données de localisation.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Charger les données initiales
  useEffect(() => {
    fetchLocations();
  }, []);

  // Mettre en place la souscription en temps réel
  useEffect(() => {
    const equipmentChannel = supabase
      .channel('realtime-equipment')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'suivi_materiels' 
      }, () => {
        fetchLocations();
      })
      .subscribe();

    const teamsChannel = supabase
      .channel('realtime-teams')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'suivi_equipes' 
      }, () => {
        fetchLocations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(equipmentChannel);
      supabase.removeChannel(teamsChannel);
    };
  }, []);

  const handleRefresh = () => {
    fetchLocations();
    toast({
      title: "Actualisation en cours",
      description: "Les données de localisation sont en cours de mise à jour.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mappemonde</h1>
          <p className="text-muted-foreground">
            Suivi en temps réel de la localisation des équipes et du matériel
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Équipes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <div className="flex items-center">
                <div className="text-3xl font-bold">{stats.teams}</div>
                <Badge className="ml-2 bg-green-500">Visible sur la carte</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Matériel</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <div className="flex items-center">
                <div className="text-3xl font-bold">{stats.equipment}</div>
                <Badge className="ml-2 bg-blue-500">Visible sur la carte</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Dernière mise à jour</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <div className="text-sm text-muted-foreground">
                {stats.updatedAt.toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {loading && locations.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-[calc(100vh-16rem)]">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Chargement des données de localisation...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <WorldMap locations={locations} />
      )}
    </div>
  );
};

export default WorldMapPage;
