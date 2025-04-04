
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
        const [interventionsData, clientsData, teamsData] = await Promise.all([
          interventionService.getDetailedInterventions(),
          clientService.getAll(),
          equipeService.getAll()
        ]);

        setInterventions(interventionsData);
        setClients(clientsData);
        setTeams(teamsData);
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
      const filteredInterventions = await interventionService.getDetailedInterventions(filters);
      setInterventions(filteredInterventions);
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
    // Dans une véritable application, cela mettrait à jour le statut via une API
    // Ici, nous simulons juste la mise à jour
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
