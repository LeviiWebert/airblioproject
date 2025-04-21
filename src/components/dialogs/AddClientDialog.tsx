
import React, { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import ClientForm from "@/components/forms/ClientForm";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
      const { data, error } = await supabase
        .from("clients")
        .insert([
          {
            nom_entreprise: values.nomEntreprise,
            email: values.email || null,
            tel: values.tel || null,
            identifiant: values.identifiant || null,
            mdp: values.mdp || null,
          },
        ])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Client créé",
        description: "Le client a été créé avec succès.",
      });
      
      startTransition(() => {
        onOpenChange(false);
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        onClientAdded();
      });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
