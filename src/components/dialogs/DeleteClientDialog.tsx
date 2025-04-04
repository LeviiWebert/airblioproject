
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

interface DeleteClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientDeleted: () => void;
  clientId: string;
  clientName: string;
}

const DeleteClientDialog = ({
  open,
  onOpenChange,
  onClientDeleted,
  clientId,
  clientName,
}: DeleteClientDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Check if the client has any related interventions
      const { data: demandesData, error: demandesError } = await supabase
        .from("demande_interventions")
        .select("*")
        .eq("client_id", clientId);

      if (demandesError) throw demandesError;

      if (demandesData && demandesData.length > 0) {
        throw new Error("Ce client a des demandes d'interventions associées et ne peut pas être supprimé.");
      }

      // Delete the client
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);

      if (error) throw error;

      toast({
        title: "Client supprimé",
        description: "Le client a été supprimé avec succès.",
      });
      
      onOpenChange(false);
      onClientDeleted();
    } catch (error: any) {
      console.error("Erreur lors de la suppression du client:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de supprimer le client: ${error.message}`,
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
            Cette action va supprimer définitivement le client "{clientName}".
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

export default DeleteClientDialog;
