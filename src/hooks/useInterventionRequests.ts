
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

  // Fonctions pour sélectionner une demande et définir l'action (accept/reject)
  const handleAccept = (request: any) => {
    console.log("Selecting request for acceptance:", request);
    setSelectedRequest(request);
    setActionType("accept");
  };

  const handleReject = (request: any) => {
    console.log("Selecting request for rejection:", request);
    setSelectedRequest(request);
    setActionType("reject");
  };

  // Fonction pour confirmer l'action (accept/reject)
  const confirmAction = async () => {
    if (!selectedRequest || !actionType) {
      console.error("No request or action type selected");
      return false;
    }
    
    setProcessing(true);
    
    try {
      console.log(`Confirming ${actionType} for request ID: ${selectedRequest.id}`);
      
      if (actionType === "accept") {
        // Créer l'intervention basée sur la demande
        const newIntervention = await demandeInterventionService.createFromRequestAndDelete(selectedRequest.id);
        console.log("Intervention created successfully:", newIntervention);
        
        // Mettre à jour l'interface en supprimant la demande traitée
        setRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
        
        toast.success("Demande acceptée et intervention créée avec succès");
        setProcessing(false);
        return true;
      } else if (actionType === "reject") {
        // Rejeter la demande
        await demandeInterventionService.updateStatus(selectedRequest.id, "rejetée");
        
        // Mettre à jour l'interface en supprimant la demande traitée
        setRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
        
        toast.success("Demande refusée avec succès");
        setProcessing(false);
        return true;
      }
      
      return false;
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
    setSelectedRequest,
    actionType,
    handleAccept,
    handleReject,
    confirmAction,
    refreshRequests: fetchRequests
  };
};
