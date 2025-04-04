
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
import { deleteFacturation } from "@/services/supabaseService/facturationService";

interface DeleteInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceDeleted: () => void;
  invoiceId: string;
  invoiceRef: string;
}

const DeleteInvoiceDialog = ({
  open,
  onOpenChange,
  onInvoiceDeleted,
  invoiceId,
  invoiceRef,
}: DeleteInvoiceDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteFacturation(invoiceId);
      
      toast({
        title: "Facture supprimée",
        description: "La facture a été supprimée avec succès.",
      });
      
      onOpenChange(false);
      onInvoiceDeleted();
    } catch (error: any) {
      console.error("Erreur lors de la suppression de la facture:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Impossible de supprimer la facture: ${error.message}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer la facture {invoiceRef} ? Cette action ne peut pas être annulée.
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

export default DeleteInvoiceDialog;
