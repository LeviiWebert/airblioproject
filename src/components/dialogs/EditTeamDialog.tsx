
import React, { useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import TeamForm from "@/components/forms/TeamForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Equipe } from "@/types/models";
import { equipeService } from "@/services/dataService";

interface EditTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamUpdated: () => void;
  team: Equipe;
}

const EditTeamDialog = ({ open, onOpenChange, onTeamUpdated, team }: EditTeamDialogProps) => {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const updateTeamMutation = useMutation({
    mutationFn: async (values: { nom: string; specialisation?: string }) => {
      return await equipeService.updateTeam(team.id, values);
    },
    onSuccess: () => {
      toast({
        title: "Équipe mise à jour",
        description: "L'équipe a été mise à jour avec succès.",
      });

      // Envelopper les changements d'interface dans startTransition
      startTransition(() => {
        onOpenChange(false);
        // Important: Déplacer l'invalidation des requêtes dans la transition
        queryClient.invalidateQueries({ queryKey: ["teams"] });
        onTeamUpdated();
      });
    },
    onError: (error: any) => {
      console.error("Erreur lors de la mise à jour de l'équipe:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de mettre à jour l'équipe: ${error.message}`,
      });
    }
  });

  const handleSubmit = async (values: { nom: string; specialisation?: string }) => {
    updateTeamMutation.mutate(values);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (updateTeamMutation.isPending || isPending) return;
    
    // Envelopper le changement d'état de la modale dans startTransition
    startTransition(() => {
      onOpenChange(newOpen);
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier l'équipe</DialogTitle>
        </DialogHeader>
        <TeamForm 
          onSubmit={handleSubmit} 
          initialData={team} 
          isSubmitting={updateTeamMutation.isPending || isPending}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditTeamDialog;
