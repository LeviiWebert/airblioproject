
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import WorldMap from "@/components/maps/WorldMap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const WorldMapPage = () => {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchLocations = async () => {
    try {
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

      const locations = [
        ...(equipmentResponse.data || []).map(item => ({
          id: item.id,
          type: 'equipment' as const,
          name: item.materiel?.reference || 'Matériel sans référence',
          latitude: item.latitude || 48.8566,
          longitude: item.longitude || 2.3522,
          details: `Type: ${item.materiel?.type_materiel || 'Non spécifié'}<br/>État: ${item.etat_apres || 'Non spécifié'}`
        })),
        ...(teamsResponse.data || []).map(item => ({
          id: item.id,
          type: 'team' as const,
          name: item.equipe?.nom || 'Équipe sans nom',
          latitude: item.latitude || 48.8566,
          longitude: item.longitude || 2.3522,
          details: `Spécialisation: ${item.equipe?.specialisation || 'Non spécifiée'}<br/>Rôle: ${item.role_equipe || 'Non spécifié'}`
        }))
      ];

      setLocations(locations);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mappemonde</h1>
          <p className="text-muted-foreground">
            Suivi en temps réel de la localisation des équipes et du matériel
          </p>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center h-[calc(100vh-16rem)]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : (
        <WorldMap locations={locations} />
      )}
    </div>
  );
};

export default WorldMapPage;
