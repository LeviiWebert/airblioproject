
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import EquipmentForm, { EquipmentFormValues } from "@/components/forms/EquipmentForm";
import { supabase } from "@/integrations/supabase/client";

interface AddEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEquipmentAdded: () => void;
}

const AddEquipmentDialog = ({ open, onOpenChange, onEquipmentAdded }: AddEquipmentDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: EquipmentFormValues) => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("materiels")
        .insert([
          {
            reference: values.reference,
            type_materiel: values.typeMateriel,
            etat: values.etat,
          },
        ])
        .select();

      if (error) throw error;

      toast({
        title: "Matériel ajouté",
        description: "Le matériel a été ajouté avec succès.",
      });
      
      onOpenChange(false);
      onEquipmentAdded();
    } catch (error: any) {
      console.error("Erreur lors de l'ajout du matériel:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible d'ajouter le matériel: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un matériel</DialogTitle>
        </DialogHeader>
        <EquipmentForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  );
};

export default AddEquipmentDialog;
