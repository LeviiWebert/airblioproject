
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
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const InterventionsPage = () => {
  const [loading, setLoading] = useState(true);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [error, setError] = useState<string | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const location = useLocation();
  
  const { toast: useToastHook } = useToast();

  // Vérifier s'il y a un paramètre de rafraîchissement dans l'URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('refresh') === 'true') {
      fetchInterventions();
    }
  }, [location]);

  // Function to fetch data with or without filters
  const fetchInterventions = async (filterOptions: FilterOptions = {}) => {
    setLoading(true);
    setError(null);
    
    console.log("Fetching interventions with filters:", filterOptions);
    
    // Clear any existing timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    
    // Set timeout for loading
    loadTimeoutRef.current = setTimeout(() => {
      setLoading(false);
      setError("Le chargement a pris trop de temps. Veuillez réessayer.");
      toast.error("Délai de chargement dépassé. Veuillez rafraîchir la page.");
    }, 15000);
    
    try {
      // Utiliser le service pour récupérer les interventions avec les filtres
      const formattedInterventions = await interventionService.getDetailedInterventions(filterOptions);
      console.log("Formatted interventions after filtering:", formattedInterventions);
      setInterventions(formattedInterventions);
    } catch (error: any) {
      console.error("Error fetching interventions:", error);
      setError("Impossible de charger les données. " + error.message);
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

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get clients and teams in parallel
        const [clientsData, teamsData] = await Promise.all([
          clientService.getAll(),
          equipeService.getAll()
        ]);
        
        setClients(clientsData);
        setTeams(teamsData);
        
        // Fetch interventions with no filters initially
        await fetchInterventions();
      } catch (error: any) {
        console.error("Error loading initial data:", error);
        setError("Impossible de charger les données initiales.");
        useToastHook({
          variant: "destructive",
          title: "Erreur de chargement",
          description: "Impossible de charger les données initiales.",
        });
      }
    };
    
    loadData();
    
    // Subscribe to events for real-time updates
    const interventionChanges = supabase
      .channel('public:interventions')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'interventions' 
      }, () => {
        console.log('Intervention changes detected, refreshing...');
        fetchInterventions(filters);
      })
      .subscribe();
    
    return () => {
      // Clean up timeout and subscription on unmount
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      supabase.removeChannel(interventionChanges);
    };
  }, []);

  // Handle filter changes
  const handleFilter = (newFilters: FilterOptions) => {
    console.log("Filter applied:", newFilters);
    setFilters(newFilters);
    fetchInterventions(newFilters);
  };

  // Handle status change for an intervention
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

      // Then update the database using the service
      await interventionService.updateStatus(id, newStatus);
      
      toast.success(`Statut de l'intervention mis à jour : ${newStatus}`);
      
      useToastHook({
        title: "Statut mis à jour",
        description: `L'intervention a été mise à jour vers: ${newStatus}`,
      });
    } catch (error: any) {
      console.error("Error updating intervention status:", error);
      // Revert the optimistic update by refetching current data
      fetchInterventions(filters);
      useToastHook({
        variant: "destructive",
        title: "Erreur de mise à jour",
        description: "Impossible de modifier le statut de l'intervention.",
      });
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    fetchInterventions(filters);
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
