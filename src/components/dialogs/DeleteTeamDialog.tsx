
import React, { useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();

  const deleteTeamMutation = useMutation({
    mutationFn: async () => {
      return await equipeService.deleteTeam(teamId);
    },
    onSuccess: () => {
      toast({
        title: "Équipe supprimée",
        description: "L'équipe a été supprimée avec succès.",
      });

      startTransition(() => {
        // Combiner les mises à jour d'UI et l'invalidation dans la même transition
        onOpenChange(false);
        queryClient.invalidateQueries({ queryKey: ["teams"] });
        onTeamDeleted();
      });
    },
    onError: (error: any) => {
      console.error("Erreur lors de la suppression de l'équipe:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de supprimer l'équipe: ${error.message}`,
      });
    }
  });

  const handleDelete = () => {
    deleteTeamMutation.mutate();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (deleteTeamMutation.isPending || isPending) return;
    
    startTransition(() => {
      onOpenChange(newOpen);
    });
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
          <AlertDialogCancel disabled={deleteTeamMutation.isPending || isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={deleteTeamMutation.isPending || isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteTeamMutation.isPending || isPending ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteTeamDialog;
