
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import EquipmentForm from "@/components/forms/EquipmentForm";
import { supabase } from "@/integrations/supabase/client";
import { Materiel } from "@/types/models";

interface EditEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEquipmentUpdated: () => void;
  equipment: Materiel;
}

const EditEquipmentDialog = ({ open, onOpenChange, onEquipmentUpdated, equipment }: EditEquipmentDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: { reference: string; typeMateriel: string; etat: string }) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("materiels")
        .update({
          reference: values.reference,
          type_materiel: values.typeMateriel,
          etat: values.etat,
        })
        .eq("id", equipment.id);

      if (error) throw error;

      toast({
        title: "Matériel mis à jour",
        description: "Le matériel a été mis à jour avec succès.",
      });
      
      onOpenChange(false);
      onEquipmentUpdated();
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du matériel:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de mettre à jour le matériel: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier le matériel</DialogTitle>
        </DialogHeader>
        <EquipmentForm onSubmit={handleSubmit} initialData={equipment} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  );
};

export default EditEquipmentDialog;
