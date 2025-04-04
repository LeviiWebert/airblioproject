
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import InvoiceForm from "@/components/forms/InvoiceForm";
import { updateFacturation, FacturationFormData, FacturationWithDetails } from "@/services/supabaseService/facturationService";

interface EditInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceUpdated: () => void;
  invoice: FacturationWithDetails;
}

const EditInvoiceDialog = ({ open, onOpenChange, onInvoiceUpdated, invoice }: EditInvoiceDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: FacturationFormData) => {
    setIsSubmitting(true);
    try {
      await updateFacturation(invoice.id, values);

      toast({
        title: "Facture mise à jour",
        description: "La facture a été modifiée avec succès.",
      });
      
      onOpenChange(false);
      onInvoiceUpdated();
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de la facture:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de mettre à jour la facture: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Modifier la facture</DialogTitle>
        </DialogHeader>
        <InvoiceForm onSubmit={handleSubmit} initialData={invoice} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  );
};

export default EditInvoiceDialog;
