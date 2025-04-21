
import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Equipe } from "@/types/models";
import AddTeamDialog from "@/components/dialogs/AddTeamDialog";
import EditTeamDialog from "@/components/dialogs/EditTeamDialog";
import DeleteTeamDialog from "@/components/dialogs/DeleteTeamDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { equipeService } from "@/services/dataService";

const TeamsPage = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Equipe | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  // Use React Query for data fetching
  const {
    data: teams = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      try {
        const data = await equipeService.getAll();
        
        // Transform the data to match our Equipe type
        return data.map((team) => ({
          id: team.id,
          nom: team.nom,
          specialisation: team.specialisation || '',
          membres: []  // We'll need another query to get team members if needed
        }));
      } catch (error) {
        console.error("Erreur lors du chargement des équipes:", error);
        throw error;
      }
    },
    staleTime: 60000 // 1 minute
  });

  // Show errors with toast if necessary
  if (error) {
    console.error("Erreur de requête:", error);
    toast({
      variant: "destructive",
      title: "Erreur de chargement",
      description: "Impossible de charger les équipes.",
    });
  }

  const handleEdit = (team: Equipe) => {
    startTransition(() => {
      setSelectedTeam(team);
      setIsEditDialogOpen(true);
    });
  };

  const handleDelete = (team: Equipe) => {
    startTransition(() => {
      setSelectedTeam(team);
      setIsDeleteDialogOpen(true);
    });
  };

  const refreshTeams = () => {
    startTransition(() => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des équipes</h1>
          <p className="text-muted-foreground">
            Consultez et gérez les équipes d'intervention.
          </p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => startTransition(() => setIsAddDialogOpen(true))}
        >
          <Plus className="h-4 w-4" />
          <span>Nouvelle équipe</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Chargement des équipes...</p>
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom de l'équipe</TableHead>
                <TableHead>Spécialisation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.length > 0 ? (
                teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.nom}</TableCell>
                    <TableCell>{team.specialisation}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(team)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(team)}
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Aucune équipe trouvée.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AddTeamDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onTeamAdded={refreshTeams}
      />

      {selectedTeam && (
        <>
          <EditTeamDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onTeamUpdated={refreshTeams}
            team={selectedTeam}
          />

          <DeleteTeamDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onTeamDeleted={refreshTeams}
            teamId={selectedTeam.id}
            teamName={selectedTeam.nom}
          />
        </>
      )}
    </div>
  );
};

export default TeamsPage;
