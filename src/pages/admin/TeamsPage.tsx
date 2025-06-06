
import { useState, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Equipe } from "@/types/models";
import AddTeamDialog from "@/components/dialogs/AddTeamDialog";
import EditTeamDialog from "@/components/dialogs/EditTeamDialog";
import DeleteTeamDialog from "@/components/dialogs/DeleteTeamDialog";
import { useQuery } from "@tanstack/react-query";
import { equipeService } from "@/services/dataService";

const TeamsPage = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Equipe | null>(null);
  const { toast } = useToast();

  // Utiliser React Query pour la récupération des données
  const {
    data: teams = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      try {
        const data = await equipeService.getAll();
        return data.map((team) => ({
          ...team,
          membres: [] // Garder la même structure de données
        }));
      } catch (error) {
        console.error("Erreur lors du chargement des équipes:", error);
        throw error;
      }
    },
    staleTime: 60000 // 1 minute
  });

  // Afficher les erreurs avec toast si nécessaire
  if (error) {
    console.error("Erreur de requête:", error);
    toast({
      variant: "destructive",
      title: "Erreur de chargement",
      description: "Impossible de charger les équipes.",
    });
  }

  const handleAddTeam = () => {
    setIsAddDialogOpen(true);
  };

  const handleEdit = (team: Equipe) => {
    setSelectedTeam(team);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (team: Equipe) => {
    setSelectedTeam(team);
    setIsDeleteDialogOpen(true);
  };

  const refreshTeams = () => {
    refetch();
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
          onClick={handleAddTeam}
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
                <TableHead>Disponibilité</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.length > 0 ? (
                teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.nom}</TableCell>
                    <TableCell>{team.specialisation || "Non spécifiée"}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={team.disponibilite ? "default" : "destructive"}
                      >
                        {team.disponibilite ? "Disponible" : "Non disponible"}
                      </Badge>
                    </TableCell>
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
                  <TableCell colSpan={4} className="h-24 text-center">
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
