
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { interventionService } from "@/services/dataService";
import { useInterventionRequests } from "@/hooks/useInterventionRequests";
import { ConfirmationDialog } from "@/components/interventions/ConfirmationDialog";
import { InterventionRequestsTable } from "@/components/interventions/InterventionRequestsTable";

const InterventionRequests = () => {
  const navigate = useNavigate();
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // Utiliser le hook personnalisé pour gérer les requêtes
  const {
    isLoading,
    data: requests = [],
    acceptRequest,
    rejectRequest,
    isAccepting,
    isRejecting,
  } = useInterventionRequests();

  const handleAcceptRequest = async () => {
    if (!selectedRequest) return;

    try {
      await acceptRequest(selectedRequest.id);
      toast.success("Demande d'intervention acceptée avec succès");
    } catch (error) {
      console.error("Erreur lors de l'acceptation de la demande:", error);
      toast.error("Erreur lors de l'acceptation de la demande");
    } finally {
      setShowAcceptDialog(false);
      setSelectedRequest(null);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;

    try {
      await rejectRequest(selectedRequest.id);
      toast.success("Demande d'intervention refusée");
    } catch (error) {
      console.error("Erreur lors du refus de la demande:", error);
      toast.error("Erreur lors du refus de la demande");
    } finally {
      setShowRejectDialog(false);
      setSelectedRequest(null);
    }
  };

  const openAcceptDialog = (request: any) => {
    setSelectedRequest(request);
    setShowAcceptDialog(true);
  };

  const openRejectDialog = (request: any) => {
    setSelectedRequest(request);
    setShowRejectDialog(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Demandes d'intervention en attente</h1>
        <p className="text-muted-foreground">
          Consultez et traitez les demandes d'intervention soumises par les clients.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Chargement des demandes...</p>
          </div>
        </div>
      ) : (
        <InterventionRequestsTable
          requests={requests}
          onAccept={openAcceptDialog}
          onReject={openRejectDialog}
        />
      )}

      {/* Boîtes de dialogue de confirmation */}
      <ConfirmationDialog
        open={showAcceptDialog}
        onOpenChange={setShowAcceptDialog}
        title="Accepter la demande d'intervention"
        description="Êtes-vous sûr de vouloir accepter cette demande d'intervention ? Une nouvelle intervention sera créée."
        actionLabel="Accepter"
        actionVariant="default"
        isLoading={isAccepting}
        onAction={handleAcceptRequest}
      />

      <ConfirmationDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        title="Refuser la demande d'intervention"
        description="Êtes-vous sûr de vouloir refuser cette demande d'intervention ? Cette action est irréversible."
        actionLabel="Refuser"
        actionVariant="destructive"
        isLoading={isRejecting}
        onAction={handleRejectRequest}
      />
    </div>
  );
};

export default InterventionRequests;
