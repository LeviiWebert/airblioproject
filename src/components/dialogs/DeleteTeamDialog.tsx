
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

interface DeleteTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamDeleted: () => void;
  teamId: string;
  teamName: string;
}

const DeleteTeamDialog = ({
  open,
  onOpenChange,
  onTeamDeleted,
  teamId,
  teamName,
}: DeleteTeamDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // First, delete any related records in equipe_membres
      const { error: membersError } = await supabase
        .from("equipe_membres")
        .delete()
        .eq("equipe_id", teamId);

      if (membersError) throw membersError;

      // Then delete the team
      const { error } = await supabase
        .from("equipes")
        .delete()
        .eq("id", teamId);

      if (error) throw error;

      toast({
        title: "Équipe supprimée",
        description: "L'équipe a été supprimée avec succès.",
      });
      
      onOpenChange(false);
      onTeamDeleted();
    } catch (error: any) {
      console.error("Erreur lors de la suppression de l'équipe:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de supprimer l'équipe: ${error.message}`,
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
            Cette action va supprimer définitivement l'équipe "{teamName}".
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

export default DeleteTeamDialog;
