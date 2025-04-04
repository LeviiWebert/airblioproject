
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import InvoiceForm from "@/components/forms/InvoiceForm";
import { createFacturation, FacturationFormData } from "@/services/supabaseService/facturationService";

interface AddInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceAdded: () => void;
}

const AddInvoiceDialog = ({ open, onOpenChange, onInvoiceAdded }: AddInvoiceDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: FacturationFormData) => {
    setIsSubmitting(true);
    try {
      await createFacturation(values);

      toast({
        title: "Facture ajoutée",
        description: "La facture a été créée avec succès.",
      });
      
      onOpenChange(false);
      onInvoiceAdded();
    } catch (error: any) {
      console.error("Erreur lors de l'ajout de la facture:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible d'ajouter la facture: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle facture</DialogTitle>
        </DialogHeader>
        <InvoiceForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  );
};

export default AddInvoiceDialog;
