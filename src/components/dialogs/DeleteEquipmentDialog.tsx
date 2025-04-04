
import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DeleteEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEquipmentDeleted: () => void;
  equipmentId: string;
  equipmentReference: string;
}

const DeleteEquipmentDialog = ({
  open,
  onOpenChange,
  onEquipmentDeleted,
  equipmentId,
  equipmentReference,
}: DeleteEquipmentDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Check if the equipment is used in any intervention
      const { data: usageData, error: usageError } = await supabase
        .from("intervention_materiels")
        .select("*")
        .eq("materiel_id", equipmentId);

      if (usageError) throw usageError;

      if (usageData && usageData.length > 0) {
        throw new Error("Ce matériel est utilisé dans une ou plusieurs interventions et ne peut pas être supprimé.");
      }

      // Delete the equipment
      const { error } = await supabase
        .from("materiels")
        .delete()
        .eq("id", equipmentId);

      if (error) throw error;

      toast({
        title: "Matériel supprimé",
        description: "Le matériel a été supprimé avec succès.",
      });
      
      onOpenChange(false);
      onEquipmentDeleted();
    } catch (error: any) {
      console.error("Erreur lors de la suppression du matériel:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de supprimer le matériel: ${error.message}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action va supprimer définitivement le matériel "{equipmentReference}".
            Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteEquipmentDialog;
