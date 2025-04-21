
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { equipeService } from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { interventionService } from "@/services/dataService";

interface ManageTeamsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interventionId: string;
  currentTeams: any[];
  onTeamsUpdated: () => void;
}

const ManageTeamsDialog = ({
  open,
  onOpenChange,
  interventionId,
  currentTeams,
  onTeamsUpdated,
}: ManageTeamsDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [assignedTeams, setAssignedTeams] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  // Load all available teams
  useEffect(() => {
    const fetchAvailableTeams = async () => {
      try {
        setLoadingTeams(true);
        const teams = await equipeService.getAll();
        setAvailableTeams(teams);
      } catch (error) {
        console.error("Erreur lors du chargement des équipes disponibles:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les équipes disponibles.",
        });
      } finally {
        setLoadingTeams(false);
      }
    };

    if (open) {
      fetchAvailableTeams();
      // Initialize assigned teams with current teams
      setAssignedTeams(currentTeams);
    }
  }, [open, toast]);

  const handleAddTeam = () => {
    if (!selectedTeamId) return;

    // Find the selected team
    const teamToAdd = availableTeams.find(team => team.id === selectedTeamId);
    if (!teamToAdd) return;

    // Check if already assigned
    if (assignedTeams.some(team => team.id === selectedTeamId)) {
      toast({
        variant: "destructive",
        title: "Équipe déjà assignée",
        description: "Cette équipe est déjà assignée à l'intervention.",
      });
      return;
    }

    // Add to assigned teams
    setAssignedTeams([...assignedTeams, teamToAdd]);
    setSelectedTeamId("");
  };

  const handleRemoveTeam = (teamId: string) => {
    setAssignedTeams(assignedTeams.filter(team => team.id !== teamId));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Get IDs of assigned teams
      const teamIds = assignedTeams.map(team => team.id);
      
      // Update intervention teams
      await interventionService.updateTeams(interventionId, teamIds);
      
      toast({
        title: "Équipes mises à jour",
        description: "Les équipes ont été mises à jour avec succès.",
      });
      
      onTeamsUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour des équipes:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour les équipes.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gérer les équipes</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Équipes assignées</h3>
            
            {assignedTeams.length > 0 ? (
              <div className="space-y-2">
                {assignedTeams.map((team) => (
                  <div key={team.id} className="flex items-center justify-between bg-secondary/20 p-2 rounded-md">
                    <div>
                      <span className="font-medium">{team.nom}</span>
                      {team.specialisation && (
                        <Badge variant="outline" className="ml-2">{team.specialisation}</Badge>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveTeam(team.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune équipe assignée</p>
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Ajouter une équipe</h3>
            
            <div className="flex space-x-2">
              {loadingTeams ? (
                <div className="w-full flex items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Chargement...</span>
                </div>
              ) : (
                <>
                  <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner une équipe" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.nom} {team.specialisation ? `(${team.specialisation})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleAddTeam} 
                    disabled={!selectedTeamId}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageTeamsDialog;
