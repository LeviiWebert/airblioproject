
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import TeamForm from "@/components/forms/TeamForm";
import { supabase } from "@/integrations/supabase/client";

interface AddTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamAdded: () => void;
}

const AddTeamDialog = ({ open, onOpenChange, onTeamAdded }: AddTeamDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: { nom: string; specialisation?: string }) => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("equipes")
        .insert([
          {
            nom: values.nom,
            specialisation: values.specialisation || null,
          },
        ])
        .select();

      if (error) throw error;

      toast({
        title: "Équipe créée",
        description: "L'équipe a été créée avec succès.",
      });
      
      onOpenChange(false);
      onTeamAdded();
    } catch (error: any) {
      console.error("Erreur lors de la création de l'équipe:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de créer l'équipe: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter une équipe</DialogTitle>
        </DialogHeader>
        <TeamForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  );
};

export default AddTeamDialog;
