
import React, { useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import ClientForm from "@/components/forms/ClientForm";
import { Client } from "@/types/models";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientService } from "@/services/dataService";

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientUpdated: () => void;
  client: Client;
}

const EditClientDialog = ({ open, onOpenChange, onClientUpdated, client }: EditClientDialogProps) => {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const updateClientMutation = useMutation({
    mutationFn: async (values: {
      nomEntreprise: string;
      email?: string;
      tel?: string;
      identifiant?: string;
      mdp?: string;
    }) => {
      return await clientService.updateClient(client.id, {
        nom_entreprise: values.nomEntreprise,
        email: values.email || null,
        tel: values.tel || null,
        identifiant: values.identifiant || null,
        mdp: values.mdp || null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Client mis à jour",
        description: "Le client a été mis à jour avec succès.",
      });
      
      startTransition(() => {
        onOpenChange(false);
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        onClientUpdated();
      });
    },
    onError: (error: any) => {
      console.error("Erreur lors de la mise à jour du client:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de mettre à jour le client: ${error.message}`,
      });
    }
  });

  const handleSubmit = async (values: {
    nomEntreprise: string;
    email?: string;
    tel?: string;
    identifiant?: string;
    mdp?: string;
  }) => {
    updateClientMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (updateClientMutation.isPending || isPending) return;
      startTransition(() => {
        onOpenChange(newOpen);
      });
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier le client</DialogTitle>
        </DialogHeader>
        <ClientForm 
          onSubmit={handleSubmit} 
          initialData={client} 
          isSubmitting={updateClientMutation.isPending || isPending}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditClientDialog;
