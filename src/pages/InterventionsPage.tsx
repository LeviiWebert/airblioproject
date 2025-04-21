
import { useEffect, useState, useRef } from "react";
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
import { Plus, RefreshCcw, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const InterventionsPage = () => {
  const [loading, setLoading] = useState(true);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({});
  const [error, setError] = useState<string | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast: useToastHook } = useToast();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    // Set a timeout to prevent infinite loading
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    
    loadTimeoutRef.current = setTimeout(() => {
      setLoading(false);
      setError("Le chargement a pris trop de temps. Veuillez réessayer.");
      toast.error("Délai de chargement dépassé. Veuillez rafraîchir la page.");
    }, 15000); // 15 seconds timeout
    
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
    } catch (error: any) {
      console.error("Error fetching interventions data:", error);
      setError("Impossible de charger les données des interventions. " + error.message);
      useToastHook({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de charger les données des interventions.",
      });
    } finally {
      setLoading(false);
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    }
  };

  useEffect(() => {
    fetchData();
    
    return () => {
      // Clean up timeout on unmount
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  const handleFilter = async (filters: FilterOptions) => {
    setLoading(true);
    setError(null);
    setCurrentFilters(filters);
    
    console.log("Applying filters:", filters);
    
    // Set a timeout to prevent infinite loading
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    
    loadTimeoutRef.current = setTimeout(() => {
      setLoading(false);
      setError("Le filtrage a pris trop de temps. Veuillez réessayer.");
      toast.error("Délai de filtrage dépassé. Veuillez rafraîchir la page.");
    }, 10000); // 10 seconds timeout
    
    try {
      // Start with a base query
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
      
      // Apply status filter
      if (filters.status && filters.status !== "") {
        query = query.eq('statut', filters.status);
      }
      
      // Apply client filter
      if (filters.client && filters.client !== "") {
        query = query.eq('demande_interventions.clients.id', filters.client);
      }
      
      // Apply date range filter
      if (filters.dateRange?.from) {
        const fromDate = new Date(filters.dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        query = query.gte('date_debut', fromDate.toISOString());
      }
      
      if (filters.dateRange?.to) {
        const toDate = new Date(filters.dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        query = query.lte('date_debut', toDate.toISOString());
      }
      
      // Execute the query
      const { data, error } = await query;
      
      if (error) {
        console.error("Filtering error:", error);
        throw error;
      }
      
      console.log("Filtered data from Supabase:", data);
      
      // Clear the timeout as data has been fetched
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      
      // Transform data into the expected format
      let formattedInterventions = data.map(item => ({
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
      
      // Apply team filter in JavaScript (as it's a nested array relationship)
      if (filters.team && filters.team !== "") {
        formattedInterventions = formattedInterventions.filter(intervention => 
          intervention.equipes.some(eq => eq.id === filters.team)
        );
      }
      
      console.log("Filtered interventions:", formattedInterventions);
      setInterventions(formattedInterventions);
    } catch (error: any) {
      console.error("Error filtering interventions:", error);
      setError("Impossible d'appliquer les filtres. " + error.message);
      useToastHook({
        variant: "destructive",
        title: "Erreur de filtrage",
        description: "Impossible d'appliquer les filtres.",
      });
    } finally {
      setLoading(false);
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      // First update the UI optimistically
      setInterventions(
        interventions.map((intervention) => {
          if (intervention.id === id) {
            return {
              ...intervention,
              statut: newStatus,
              ...(newStatus === "en_cours" && { dateDebut: new Date() }),
              ...(newStatus === "terminée" && { dateFin: new Date() }),
            };
          }
          return intervention;
        })
      );

      // Then update the database
      const { error } = await supabase
        .from('interventions')
        .update({ 
          statut: newStatus,
          ...(newStatus === "en_cours" && { date_debut: new Date().toISOString() }),
          ...(newStatus === "terminée" && { date_fin: new Date().toISOString() }),
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success(`Statut de l'intervention mis à jour : ${newStatus}`);
      
      useToastHook({
        title: "Statut mis à jour",
        description: `L'intervention a été mise à jour vers: ${newStatus}`,
      });
    } catch (error: any) {
      console.error("Error updating intervention status:", error);
      // Revert the optimistic update
      fetchData();
      useToastHook({
        variant: "destructive",
        title: "Erreur de mise à jour",
        description: "Impossible de modifier le statut de l'intervention.",
      });
    }
  };

  const handleRefresh = () => {
    fetchData();
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
        <div className="flex gap-2">
          {!loading && (
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          )}
          <Link to="/admin/interventions/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Nouvelle intervention</span>
            </Button>
          </Link>
        </div>
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
      ) : error ? (
        <div className="rounded-md border p-8 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
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
