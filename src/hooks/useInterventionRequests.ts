
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { demandeInterventionService } from "@/services/supabaseService";

export const useInterventionRequests = () => {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(null);
  
  const { toast: useToastHook } = useToast();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await demandeInterventionService.getPending();
      console.log("Demandes d'intervention récupérées:", data);
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching intervention requests:", error);
      useToastHook({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de charger les demandes d'intervention.",
      });
    } finally {
      setLoading(false);
    }
  }, [useToastHook]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Ces deux fonctions définissent l'action à effectuer et enregistrent la demande sélectionnée
  const handleAccept = (request: any) => {
    console.log("Accepting request:", request);
    setSelectedRequest(request);
    setActionType("accept");
  };

  const handleReject = (request: any) => {
    console.log("Rejecting request:", request);
    setSelectedRequest(request);
    setActionType("reject");
  };

  // Cette fonction permet de directement accepter une demande sans avoir à ouvrir une boîte de dialogue
  const acceptRequest = async (request: any) => {
    if (!request) {
      console.error("No request provided to acceptRequest");
      return false;
    }
    
    setProcessing(true);
    
    try {
      console.log("Processing direct acceptance for request:", request.id);
      
      // Créer l'intervention et supprimer la demande
      const intervention = await demandeInterventionService.createFromRequestAndDelete(request.id);
      console.log("Intervention created successfully:", intervention);
      
      // Mettre à jour l'interface en retirant la demande
      setRequests(prev => prev.filter(req => req.id !== request.id));
      
      toast.success("Demande acceptée et intervention créée avec succès");
      setProcessing(false);
      return true;
    } catch (error: any) {
      console.error("Erreur lors de l'acceptation directe de la demande:", error);
      useToastHook({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'acceptation de la demande.",
      });
      
      setProcessing(false);
      return false;
    }
  };

  // Cette fonction permet de directement rejeter une demande sans avoir à ouvrir une boîte de dialogue
  const rejectRequest = async (request: any) => {
    if (!request) {
      console.error("No request provided to rejectRequest");
      return false;
    }
    
    setProcessing(true);
    
    try {
      console.log("Processing direct rejection for request:", request.id);
      
      // Mettre à jour le statut de la demande à "rejetée"
      await demandeInterventionService.updateStatus(request.id, "rejetée");
      
      // Mettre à jour l'interface en retirant la demande
      setRequests(prev => prev.filter(req => req.id !== request.id));
      
      toast.success("Demande refusée avec succès");
      setProcessing(false);
      return true;
    } catch (error: any) {
      console.error("Erreur lors du refus direct de la demande:", error);
      useToastHook({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du refus de la demande.",
      });
      
      setProcessing(false);
      return false;
    }
  };

  // Cette fonction exécute l'action sélectionnée (accept ou reject) pour la demande sélectionnée
  const confirmAction = async () => {
    // Vérification que les données sélectionnées sont présentes
    if (!selectedRequest || !actionType) {
      console.error("No request or action type selected");
      return false;
    }
    
    setProcessing(true);
    
    try {
      console.log(`Confirming action: ${actionType} for request ${selectedRequest.id}`);
      
      let success = false;
      
      if (actionType === "accept") {
        success = await acceptRequest(selectedRequest);
      } else if (actionType === "reject") {
        success = await rejectRequest(selectedRequest);
      }

      // Réinitialiser les états sélectionnés
      setSelectedRequest(null);
      setActionType(null);
      
      return success;
    } catch (error: any) {
      console.error("Erreur lors de la gestion de la demande:", error);
      useToastHook({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour.",
      });
      
      setProcessing(false);
      return false;
    }
  };

  return {
    loading,
    processing,
    requests,
    selectedRequest,
    setSelectedRequest,  // <-- Added this line to expose the setter
    actionType,
    handleAccept,
    handleReject,
    acceptRequest,
    rejectRequest,
    confirmAction,
    refreshRequests: fetchRequests
  };
};
