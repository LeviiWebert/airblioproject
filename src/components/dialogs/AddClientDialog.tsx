
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import ClientForm from "@/components/forms/ClientForm";
import { supabase } from "@/integrations/supabase/client";

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientAdded: () => void;
}

const AddClientDialog = ({ open, onOpenChange, onClientAdded }: AddClientDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: {
    nomEntreprise: string;
    email?: string;
    tel?: string;
    identifiant?: string;
    mdp?: string;
  }) => {
    setIsSubmitting(true);
    try {
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

      toast({
        title: "Client créé",
        description: "Le client a été créé avec succès.",
      });
      
      onOpenChange(false);
      onClientAdded();
    } catch (error: any) {
      console.error("Erreur lors de la création du client:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de créer le client: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un client</DialogTitle>
        </DialogHeader>
        <ClientForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  );
};

export default AddClientDialog;
