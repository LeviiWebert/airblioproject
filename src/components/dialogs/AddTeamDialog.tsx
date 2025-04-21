
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import TeamForm from "@/components/forms/TeamForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { equipeService } from "@/services/dataService";

interface AddTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamAdded: () => void;
}

const AddTeamDialog = ({ open, onOpenChange, onTeamAdded }: AddTeamDialogProps) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTeamMutation = useMutation({
    mutationFn: async (values: { nom: string; specialisation?: string }) => {
      return await equipeService.createTeam(values);
    },
    onSuccess: () => {
      toast({
        title: "Équipe créée",
        description: "L'équipe a été créée avec succès.",
      });
      
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      onTeamAdded();
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      console.error("Erreur lors de la création de l'équipe:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de créer l'équipe: ${error.message}`,
      });
      setIsSubmitting(false);
    }
  });

  const handleSubmit = async (values: { nom: string; specialisation?: string }) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    createTeamMutation.mutate(values);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (isSubmitting) return;
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter une équipe</DialogTitle>
        </DialogHeader>
        <TeamForm 
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting || createTeamMutation.isPending} 
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddTeamDialog;
