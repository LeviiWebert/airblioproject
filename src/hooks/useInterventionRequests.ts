
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { demandeInterventionService } from "@/services/supabaseService";

export const useInterventionRequests = () => {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false); // New state for tracking action processing
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

  const confirmAction = async () => {
    if (!selectedRequest || !actionType) {
      console.error("No request or action type selected");
      return false;
    }
    
    setProcessing(true);
    
    try {
      console.log(`Confirming action: ${actionType} for request ${selectedRequest.id}`);
      
      if (actionType === "accept") {
        console.log("Creating intervention and deleting request");
        console.log("Request data:", selectedRequest);
        
        // Tentative de création d'intervention avec timeouts plus longs
        const intervention = await demandeInterventionService.createFromRequestAndDelete(selectedRequest.id);
        console.log("Intervention created:", intervention);
        
        // Remove the request from the local state
        setRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
        
        toast.success("Demande acceptée et intervention créée avec succès");
      } else if (actionType === "reject") {
        console.log("Rejecting request");
        await demandeInterventionService.updateStatus(selectedRequest.id, "rejetée");
        
        // Remove the request from the local state
        setRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
        
        toast.success("Demande refusée avec succès");
      }

      setSelectedRequest(null);
      setActionType(null);
      setProcessing(false);
      
      return true;
    } catch (error: any) {
      console.error("Erreur lors de la gestion de la demande:", error);
      useToastHook({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour.",
      });
      
      setProcessing(false);
      throw error;
    }
  };

  return {
    loading,
    processing,
    requests,
    selectedRequest,
    actionType,
    handleAccept,
    handleReject,
    confirmAction,
    refreshRequests: fetchRequests
  };
};
