
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import TeamForm from "@/components/forms/TeamForm";
import { supabase } from "@/integrations/supabase/client";
import { Equipe } from "@/types/models";

interface EditTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamUpdated: () => void;
  team: Equipe;
}

const EditTeamDialog = ({ open, onOpenChange, onTeamUpdated, team }: EditTeamDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: { nom: string; specialisation?: string }) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("equipes")
        .update({
          nom: values.nom,
          specialisation: values.specialisation || null,
        })
        .eq("id", team.id);

      if (error) throw error;

      toast({
        title: "Équipe mise à jour",
        description: "L'équipe a été mise à jour avec succès.",
      });
      
      onOpenChange(false);
      onTeamUpdated();
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de l'équipe:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de mettre à jour l'équipe: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier l'équipe</DialogTitle>
        </DialogHeader>
        <TeamForm onSubmit={handleSubmit} initialData={team} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  );
};

export default EditTeamDialog;
