
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
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRequest: any;
  actionType: "accept" | "reject";
  onConfirm: (comment?: string) => void;
  isLoading?: boolean;
}

export const ConfirmationDialog = ({
  open,
  onOpenChange,
  selectedRequest,
  actionType,
  onConfirm,
  isLoading = false
}: ConfirmationDialogProps) => {
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!selectedRequest) return null;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
    } catch (error) {
      return "Date inconnue";
    }
  };
  
  const handleConfirm = () => {
    if (actionType === "reject" && !comment.trim()) {
      setError("Veuillez saisir un motif de refus.");
      return;
    }
    
    setError(null);
    onConfirm(actionType === "reject" ? comment : undefined);
  };

  return (
    <AlertDialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        // Reset form state when dialog closes
        setComment("");
        setError(null);
      }
      onOpenChange(newOpen);
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {actionType === "accept"
              ? "Accepter cette demande d'intervention ?"
              : "Refuser cette demande d'intervention ?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {actionType === "accept" ? (
              <div className="space-y-2">
                <p>
                  Vous êtes sur le point d'accepter la demande d'intervention de{" "}
                  <span className="font-medium">
                    {selectedRequest.client?.nom_entreprise || "Client Inconnu"}
                  </span>{" "}
                  du {formatDate(selectedRequest.date_demande)}.
                </p>
                <p>
                  Une nouvelle intervention sera créée et la demande sera supprimée. Cette action est irréversible.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p>
                  Vous êtes sur le point de refuser la demande d'intervention de{" "}
                  <span className="font-medium">
                    {selectedRequest.client?.nom_entreprise || "Client Inconnu"}
                  </span>{" "}
                  du {formatDate(selectedRequest.date_demande)}.
                </p>
                <p>
                  La demande sera marquée comme rejetée et n'apparaîtra plus dans la liste. Cette action est irréversible.
                </p>
                
                <div className="mt-4">
                  <FormItem className="space-y-1">
                    <FormLabel className="font-medium">Motif du refus <span className="text-red-500">*</span></FormLabel>
                    <Textarea
                      placeholder="Veuillez indiquer le motif du refus..."
                      value={comment}
                      onChange={(e) => {
                        setComment(e.target.value);
                        if(e.target.value.trim()) setError(null);
                      }}
                      className={error ? "border-red-500" : ""}
                    />
                    {error && (
                      <FormMessage>{error}</FormMessage>
                    )}
                  </FormItem>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            variant={actionType === "accept" ? "default" : "destructive"}
            disabled={isLoading || (actionType === "reject" && !comment.trim())}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {actionType === "accept" ? "Accepter" : "Refuser"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
