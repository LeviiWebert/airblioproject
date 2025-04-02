
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/interventions/PriorityBadge";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRequest: any | null;
  actionType: "accept" | "reject" | null;
  onConfirm: () => void;
}

export const ConfirmationDialog = ({
  open,
  onOpenChange,
  selectedRequest,
  actionType,
  onConfirm,
}: ConfirmationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {actionType === "accept" ? "Accepter la demande" : "Refuser la demande"}
          </DialogTitle>
          <DialogDescription>
            {actionType === "accept"
              ? "Cette action créera une nouvelle intervention basée sur cette demande. Voulez-vous continuer ?"
              : "Cette action refusera définitivement la demande. Voulez-vous continuer ?"}
          </DialogDescription>
        </DialogHeader>
        
        {selectedRequest && (
          <div className="py-4">
            <p className="font-medium">{selectedRequest.client?.nom_entreprise || 'Client'}</p>
            <p className="text-sm text-muted-foreground mt-1">{selectedRequest.description}</p>
            <div className="mt-2 flex items-center">
              <span className="text-sm text-muted-foreground mr-2">Urgence:</span>
              <PriorityBadge priority={selectedRequest.urgence} />
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            variant={actionType === "accept" ? "default" : "destructive"} 
            onClick={onConfirm}
          >
            {actionType === "accept" ? "Accepter" : "Refuser"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
