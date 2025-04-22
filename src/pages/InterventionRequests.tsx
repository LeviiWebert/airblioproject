
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
  const [redirecting, setRedirecting] = useState(false);

  // Utiliser le hook personnalisé pour gérer les requêtes
  const {
    loading,
    processing,
    requests,
    selectedRequest,
    setSelectedRequest,
    actionType,
    handleAccept,
    handleReject,
    confirmAction,
    refreshRequests
  } = useInterventionRequests();

  // Fonction pour gérer l'acceptation via la boîte de dialogue
  const handleAcceptRequest = async () => {
    try {
      setRedirecting(true);
      
      const success = await confirmAction();
      
      if (success) {
        toast.success("Demande d'intervention acceptée et intervention créée avec succès");
        setShowAcceptDialog(false);
        
        // Rediriger vers la page des interventions
        setTimeout(() => {
          navigate("/admin/interventions?refresh=true");
        }, 500);
      } else {
        setRedirecting(false);
        setShowAcceptDialog(false);
      }
    } catch (error) {
      console.error("Erreur lors de l'acceptation de la demande:", error);
      toast.error("Erreur lors de l'acceptation de la demande");
      setShowAcceptDialog(false);
      setRedirecting(false);
    }
  };

  // Fonction pour gérer le rejet via la boîte de dialogue
  const handleRejectRequest = async () => {
    try {
      const success = await confirmAction();
      
      if (success) {
        toast.success("Demande d'intervention refusée");
        setShowRejectDialog(false);
        refreshRequests();
      } else {
        setShowRejectDialog(false);
      }
    } catch (error) {
      console.error("Erreur lors du refus de la demande:", error);
      toast.error("Erreur lors du refus de la demande");
      setShowRejectDialog(false);
    }
  };

  // Lorsqu'on clique sur accepter dans la table, on ouvre directement la boîte de dialogue
  const handleTableAccept = (request: any) => {
    handleAccept(request);
    setShowAcceptDialog(true);
  };

  // Lorsqu'on clique sur refuser dans la table, on ouvre directement la boîte de dialogue
  const handleTableReject = (request: any) => {
    handleReject(request);
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
          onAccept={handleTableAccept}
          onReject={handleTableReject}
          disabled={processing || redirecting}
        />
      )}

      {/* Boîtes de dialogue de confirmation */}
      <ConfirmationDialog
        open={showAcceptDialog}
        onOpenChange={setShowAcceptDialog}
        selectedRequest={selectedRequest}
        actionType="accept"
        onConfirm={handleAcceptRequest}
        isLoading={processing || redirecting}
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
