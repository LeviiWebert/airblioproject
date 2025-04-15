
import React from "react";
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
  
  const updateTeamMutation = useMutation({
    mutationFn: async (values: { nom: string; specialisation?: string }) => {
      return await equipeService.updateTeam(team.id, values);
    },
    onSuccess: () => {
      toast({
        title: "Équipe mise à jour",
        description: "L'équipe a été mise à jour avec succès.",
      });
      
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      onTeamUpdated();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier l'équipe</DialogTitle>
        </DialogHeader>
        <TeamForm 
          onSubmit={handleSubmit} 
          initialData={team} 
          isSubmitting={updateTeamMutation.isPending} 
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditTeamDialog;
