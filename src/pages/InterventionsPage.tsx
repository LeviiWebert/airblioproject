
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  clientService, 
  equipeService, 
  interventionService 
} from "@/services/dataService";
import { FilterOptions } from "@/types/models";
import { Button } from "@/components/ui/button";
import { InterventionsFilter } from "@/components/interventions/InterventionsFilter";
import { InterventionsList } from "@/components/interventions/InterventionsList";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const InterventionsPage = () => {
  const [loading, setLoading] = useState(true);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({});
  
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get clients and teams
        const [clientsData, teamsData] = await Promise.all([
          clientService.getAll(),
          equipeService.getAll()
        ]);
        
        setClients(clientsData);
        setTeams(teamsData);
        
        // Directly fetch interventions from Supabase
        const { data: interventionsData, error } = await supabase
          .from('interventions')
          .select(`
            id,
            date_debut,
            date_fin,
            localisation,
            statut,
            demande_intervention_id,
            demande_interventions:demande_intervention_id (
              description,
              urgence,
              client_id,
              clients:client_id (
                id,
                nom_entreprise
              )
            ),
            intervention_equipes (
              equipe_id,
              equipes:equipe_id (
                id,
                nom
              )
            )
          `);
          
        if (error) throw error;
        
        // Transform data into the expected format
        const formattedInterventions = interventionsData.map(item => ({
          id: item.id,
          dateDebut: item.date_debut ? new Date(item.date_debut) : null,
          dateFin: item.date_fin ? new Date(item.date_fin) : null,
          localisation: item.localisation,
          statut: item.statut,
          client: {
            id: item.demande_interventions?.clients?.id || '',
            nomEntreprise: item.demande_interventions?.clients?.nom_entreprise || 'Client inconnu'
          },
          demande: {
            description: item.demande_interventions?.description || '',
            urgence: item.demande_interventions?.urgence || 'basse'
          },
          equipes: item.intervention_equipes?.map(eq => ({
            id: eq.equipes?.id || '',
            nom: eq.equipes?.nom || 'Équipe inconnue'
          })) || []
        }));
        
        console.log("Interventions récupérées:", formattedInterventions);
        setInterventions(formattedInterventions);
      } catch (error) {
        console.error("Error fetching interventions data:", error);
        toast({
          variant: "destructive",
          title: "Erreur de chargement",
          description: "Impossible de charger les données des interventions.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handleFilter = async (filters: FilterOptions) => {
    setLoading(true);
    setCurrentFilters(filters);
    
    try {
      // Build Supabase query with filters
      let query = supabase
        .from('interventions')
        .select(`
          id,
          date_debut,
          date_fin,
          localisation,
          statut,
          demande_intervention_id,
          demande_interventions:demande_intervention_id (
            description,
            urgence,
            client_id,
            clients:client_id (
              id,
              nom_entreprise
            )
          ),
          intervention_equipes (
            equipe_id,
            equipes:equipe_id (
              id,
              nom
            )
          )
        `);
      
      // Apply filters
      if (filters.status) {
        query = query.eq('statut', filters.status);
      }
      
      if (filters.clientId) {
        query = query.eq('demande_interventions.client_id', filters.clientId);
      }
      
      if (filters.teamId) {
        // This is a bit tricky with the current structure
        // For a proper solution, we'd need to use a more complex query or post-filter the results
      }
      
      if (filters.startDate) {
        query = query.gte('date_debut', filters.startDate.toISOString());
      }
      
      if (filters.endDate) {
        query = query.lte('date_debut', filters.endDate.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform data into the expected format
      const formattedInterventions = data.map(item => ({
        id: item.id,
        dateDebut: item.date_debut ? new Date(item.date_debut) : null,
        dateFin: item.date_fin ? new Date(item.date_fin) : null,
        localisation: item.localisation,
        statut: item.statut,
        client: {
          id: item.demande_interventions?.clients?.id || '',
          nomEntreprise: item.demande_interventions?.clients?.nom_entreprise || 'Client inconnu'
        },
        demande: {
          description: item.demande_interventions?.description || '',
          urgence: item.demande_interventions?.urgence || 'basse'
        },
        equipes: item.intervention_equipes?.map(eq => ({
          id: eq.equipes?.id || '',
          nom: eq.equipes?.nom || 'Équipe inconnue'
        })) || []
      }));
      
      console.log("Interventions filtrées:", formattedInterventions);
      setInterventions(formattedInterventions);
    } catch (error) {
      console.error("Error filtering interventions:", error);
      toast({
        variant: "destructive",
        title: "Erreur de filtrage",
        description: "Impossible d'appliquer les filtres.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      toast({
        title: "Statut mis à jour",
        description: `L'intervention a été mise à jour vers: ${newStatus}`,
      });
      
      // Mettre à jour l'interface utilisateur
      setInterventions(
        interventions.map((intervention) => {
          if (intervention.id === id) {
            return {
              ...intervention,
              statut: newStatus,
              // Si le statut est "en_cours", définir la date de début sur maintenant
              // Si le statut est "terminée", définir la date de fin sur maintenant
              ...(newStatus === "en_cours" && { dateDebut: new Date() }),
              ...(newStatus === "terminée" && { dateFin: new Date() }),
            };
          }
          return intervention;
        })
      );
    } catch (error) {
      console.error("Error updating intervention status:", error);
      toast({
        variant: "destructive",
        title: "Erreur de mise à jour",
        description: "Impossible de modifier le statut de l'intervention.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des interventions</h1>
          <p className="text-muted-foreground">
            Consultez, planifiez et gérez toutes les interventions.
          </p>
        </div>
        <Link to="/admin/interventions/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Nouvelle intervention</span>
          </Button>
        </Link>
      </div>

      <InterventionsFilter
        clients={clients}
        teams={teams}
        onFilter={handleFilter}
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement des interventions...</p>
          </div>
        </div>
      ) : (
        <InterventionsList
          interventions={interventions}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default InterventionsPage;
