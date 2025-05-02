
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
    console.log("👆 Validation de l'acceptation de la demande via la boîte de dialogue");
    try {
      setRedirecting(true);
      
      console.log("🔄 Appel de confirmAction()...");
      const success = await confirmAction();
      console.log("Résultat de confirmAction:", success);
      
      if (success) {
        console.log("✅ Demande acceptée, redirection vers la page des interventions...");
        toast.success("Demande d'intervention acceptée et intervention créée avec succès");
        setShowAcceptDialog(false);
        
        // Rediriger vers la page des interventions
        setTimeout(() => {
          console.log("🔄 Redirection vers /admin/interventions?refresh=true");
          navigate("/admin/interventions?refresh=true");
        }, 500);
      } else {
        console.error("❌ Échec de la confirmation d'acceptation");
        setRedirecting(false);
        setShowAcceptDialog(false);
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'acceptation de la demande:", error);
      toast.error("Erreur lors de l'acceptation de la demande");
      setShowAcceptDialog(false);
      setRedirecting(false);
    }
  };

  // Fonction pour gérer le rejet via la boîte de dialogue
  const handleRejectRequest = async (comment?: string) => {
    console.log("👆 Validation du refus de la demande via la boîte de dialogue");
    try {
      console.log("🔄 Appel de confirmAction() avec le commentaire:", comment);
      const success = await confirmAction(comment);
      console.log("Résultat de confirmAction:", success);
      
      if (success) {
        console.log("✅ Demande rejetée avec succès");
        toast.success("Demande d'intervention refusée");
        setShowRejectDialog(false);
        refreshRequests();
      } else {
        console.error("❌ Échec de la confirmation de rejet");
        setShowRejectDialog(false);
      }
    } catch (error) {
      console.error("❌ Erreur lors du refus de la demande:", error);
      toast.error("Erreur lors du refus de la demande");
      setShowRejectDialog(false);
    }
  };

  // Lorsqu'on clique sur accepter dans la table, on ouvre directement la boîte de dialogue
  const handleTableAccept = (request: any) => {
    console.log("👆 Clic sur le bouton Accepter dans la table pour la demande:", request);
    handleAccept(request);
    setShowAcceptDialog(true);
  };

  // Lorsqu'on clique sur refuser dans la table, on ouvre directement la boîte de dialogue
  const handleTableReject = (request: any) => {
    console.log("👆 Clic sur le bouton Refuser dans la table pour la demande:", request);
    handleReject(request);
    setShowRejectDialog(true);
  };

  console.log("État actuel:", { 
    loading, 
    processing, 
    requests: requests.length,
    selectedRequest: selectedRequest ? selectedRequest.id : null,
    actionType,
    showAcceptDialog,
    showRejectDialog
  });

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
