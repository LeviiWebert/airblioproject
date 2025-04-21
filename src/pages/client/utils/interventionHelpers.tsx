
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { X } from "lucide-react";

export const formatDate = (dateString: string | null) => {
  if (!dateString) return "Non définie";
  return format(new Date(dateString), "dd MMMM yyyy à HH:mm", { locale: fr });
};

export const canCancelDemande = (demande: any) => {
  if (!demande) return false;
  const cancelableStatuses = ["en_attente", "en_cours_analyse", "validée"];
  return cancelableStatuses.includes(demande.statut);
};

export const renderCancelButton = (onCancel: () => void, cancelling: boolean) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="destructive" className="w-full sm:w-auto">
        <X className="mr-2 h-4 w-4" />
        Annuler ma demande d'intervention
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Annuler la demande d'intervention</AlertDialogTitle>
        <AlertDialogDescription>
          Êtes-vous sûr de vouloir annuler cette demande d'intervention ?
          Cette action est irréversible.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Retour</AlertDialogCancel>
        <AlertDialogAction
          onClick={onCancel}
          disabled={cancelling}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          {cancelling ? 'Annulation...' : 'Confirmer l\'annulation'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
