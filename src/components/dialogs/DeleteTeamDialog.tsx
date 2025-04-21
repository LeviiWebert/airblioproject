
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { equipeService } from "@/services/dataService";

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
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteTeamMutation = useMutation({
    mutationFn: async () => {
      return await equipeService.deleteTeam(teamId);
    },
    onSuccess: () => {
      toast({
        title: "Équipe supprimée",
        description: "L'équipe a été supprimée avec succès.",
      });

      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      onTeamDeleted();
      setIsDeleting(false);
    },
    onError: (error: any) => {
      console.error("Erreur lors de la suppression de l'équipe:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de supprimer l'équipe: ${error.message}`,
      });
      setIsDeleting(false);
    }
  });

  const handleDelete = () => {
    if (isDeleting) return;
    setIsDeleting(true);
    deleteTeamMutation.mutate();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (isDeleting) return;
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
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
