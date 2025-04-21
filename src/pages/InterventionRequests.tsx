
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
    loading,
    processing,
    requests,
    handleAccept,
    handleReject,
    confirmAction
  } = useInterventionRequests();

  const openAcceptDialog = (request: any) => {
    console.log("Ouverture de la boîte de dialogue d'acceptation pour la demande:", request.id);
    setSelectedRequest(request);
    setShowAcceptDialog(true);
  };

  const openRejectDialog = (request: any) => {
    console.log("Ouverture de la boîte de dialogue de refus pour la demande:", request.id);
    setSelectedRequest(request);
    setShowRejectDialog(true);
  };

  const handleAcceptRequest = async () => {
    if (!selectedRequest) return;

    try {
      console.log("Acceptation de la demande:", selectedRequest.id);
      handleAccept(selectedRequest);
      const success = await confirmAction();
      
      if (success) {
        toast.success("Demande d'intervention acceptée et intervention créée avec succès");
        setShowAcceptDialog(false);
        
        // Attendre un court instant avant de rediriger pour permettre à l'UI de se mettre à jour
        setTimeout(() => {
          navigate("/admin/interventions?refresh=true");
        }, 500);
      }
    } catch (error) {
      console.error("Erreur lors de l'acceptation de la demande:", error);
      toast.error("Erreur lors de l'acceptation de la demande");
      setShowAcceptDialog(false);
    } finally {
      setSelectedRequest(null);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;

    try {
      console.log("Rejet de la demande:", selectedRequest.id);
      handleReject(selectedRequest);
      const success = await confirmAction();
      
      if (success) {
        toast.success("Demande d'intervention refusée");
        setShowRejectDialog(false);
      }
    } catch (error) {
      console.error("Erreur lors du refus de la demande:", error);
      toast.error("Erreur lors du refus de la demande");
      setShowRejectDialog(false);
    } finally {
      setSelectedRequest(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Demandes d'intervention en attente</h1>
        <p className="text-muted-foreground">
          Consultez et traitez les demandes d'intervention soumises par les clients.
        </p>
      </div>

      {loading ? (
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
          disabled={processing}
        />
      )}

      {/* Boîtes de dialogue de confirmation */}
      <ConfirmationDialog
        open={showAcceptDialog}
        onOpenChange={setShowAcceptDialog}
        selectedRequest={selectedRequest}
        actionType="accept"
        onConfirm={handleAcceptRequest}
        isLoading={processing}
      />

      <ConfirmationDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        selectedRequest={selectedRequest}
        actionType="reject"
        onConfirm={handleRejectRequest}
        isLoading={processing}
      />
    </div>
  );
};

export default InterventionRequests;
