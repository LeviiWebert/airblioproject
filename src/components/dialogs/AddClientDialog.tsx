
import React, { useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import ClientForm from "@/components/forms/ClientForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientService } from "@/services/dataService";

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientAdded: () => void;
}

const AddClientDialog = ({ open, onOpenChange, onClientAdded }: AddClientDialogProps) => {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const createClientMutation = useMutation({
    mutationFn: async (values: {
      nomEntreprise: string;
      email?: string;
      tel?: string;
      identifiant?: string;
      mdp?: string;
    }) => {
      return await clientService.createClient({
        nom_entreprise: values.nomEntreprise,
        email: values.email || null,
        tel: values.tel || null,
        identifiant: values.identifiant || null,
        mdp: values.mdp || null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Client créé",
        description: "Le client a été créé avec succès.",
      });
      
      startTransition(() => {
        onOpenChange(false);
      });
      
      // Séparation de l'invalidation des requêtes du changement d'interface
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      onClientAdded();
    },
    onError: (error: any) => {
      console.error("Erreur lors de la création du client:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de créer le client: ${error.message}`,
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
    createClientMutation.mutate(values);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (createClientMutation.isPending || isPending) return;
    
    startTransition(() => {
      onOpenChange(newOpen);
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un client</DialogTitle>
        </DialogHeader>
        <ClientForm 
          onSubmit={handleSubmit} 
          isSubmitting={createClientMutation.isPending || isPending} 
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddClientDialog;
