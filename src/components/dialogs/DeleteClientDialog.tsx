
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
import { clientService } from "@/services/dataService";
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
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const deleteClientMutation = useMutation({
    mutationFn: async () => {
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
      return await clientService.deleteClient(clientId);
    },
    onSuccess: () => {
      toast({
        title: "Client supprimé",
        description: "Le client a été supprimé avec succès.",
      });
      
      startTransition(() => {
        // Combiner les mises à jour d'UI et l'invalidation dans la même transition
        onOpenChange(false);
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        onClientDeleted();
      });
    },
    onError: (error: any) => {
      console.error("Erreur lors de la suppression du client:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de supprimer le client: ${error.message}`,
      });
    }
  });

  const handleDelete = () => {
    deleteClientMutation.mutate();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (deleteClientMutation.isPending || isPending) return;
    
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
            Cette action va supprimer définitivement le client "{clientName}".
            Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteClientMutation.isPending || isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={deleteClientMutation.isPending || isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteClientMutation.isPending || isPending ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteClientDialog;
