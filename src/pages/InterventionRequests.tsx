
import { useState, useEffect } from "react";
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
    acceptRequest,
    rejectRequest,
    confirmAction,
    refreshRequests
  } = useInterventionRequests();

  // Rafraîchir les demandes au chargement
  useEffect(() => {
    refreshRequests();
  }, [refreshRequests]);

  // Fonction pour gérer le clic sur accepter dans la table
  const handleTableAccept = async (request: any) => {
    console.log("Acceptation directe de la demande:", request.id);
    setRedirecting(true);
    
    try {
      // Utiliser acceptRequest directement sans passer par la boîte de dialogue
      const success = await acceptRequest(request);
      
      if (success) {
        toast.success("Demande d'intervention acceptée et intervention créée avec succès");
        
        // Attendre un court instant avant de rediriger pour permettre à l'UI de se mettre à jour
        setTimeout(() => {
          console.log("Redirection vers la page des interventions");
          navigate("/admin/interventions?refresh=true");
        }, 1000);
      } else {
        setRedirecting(false);
      }
    } catch (error) {
      console.error("Erreur lors de l'acceptation de la demande:", error);
      toast.error("Erreur lors de l'acceptation de la demande");
      setRedirecting(false);
    }
  };

  // Fonction pour gérer le clic sur rejeter dans la table
  const handleTableReject = async (request: any) => {
    console.log("Rejet direct de la demande:", request.id);
    
    try {
      // Utiliser rejectRequest directement sans passer par la boîte de dialogue
      const success = await rejectRequest(request);
      
      if (success) {
        toast.success("Demande d'intervention refusée");
        refreshRequests();
      }
    } catch (error) {
      console.error("Erreur lors du refus de la demande:", error);
      toast.error("Erreur lors du refus de la demande");
    }
  };

  // Boîtes de dialogue (désormais utilisées uniquement comme backup)
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

  // Fonction pour gérer l'acceptation via la boîte de dialogue
  const handleAcceptRequest = async () => {
    if (!selectedRequest) return;

    try {
      setRedirecting(true);
      
      const success = await confirmAction();
      
      if (success) {
        toast.success("Demande d'intervention acceptée et intervention créée avec succès");
        setShowAcceptDialog(false);
        
        // Attendre un court instant avant de rediriger pour permettre à l'UI de se mettre à jour
        setTimeout(() => {
          console.log("Redirection vers la page des interventions");
          navigate("/admin/interventions?refresh=true");
        }, 1000);
      } else {
        setRedirecting(false);
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
    if (!selectedRequest) return;

    try {
      const success = await confirmAction();
      
      if (success) {
        toast.success("Demande d'intervention refusée");
        setShowRejectDialog(false);
        refreshRequests();
      }
    } catch (error) {
      console.error("Erreur lors du refus de la demande:", error);
      toast.error("Erreur lors du refus de la demande");
      setShowRejectDialog(false);
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
          onAccept={handleTableAccept}
          onReject={handleTableReject}
          disabled={processing || redirecting}
        />
      )}

      {/* Boîtes de dialogue de confirmation (alternative) */}
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
