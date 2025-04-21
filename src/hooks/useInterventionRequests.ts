import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { demandeInterventionService } from "@/services/supabaseService";

export const useInterventionRequests = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(null);
  
  const { toast: useToastHook } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
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
  };

  const handleAccept = (request: any) => {
    setSelectedRequest(request);
    setActionType("accept");
  };

  const handleReject = (request: any) => {
    setSelectedRequest(request);
    setActionType("reject");
  };

  const confirmAction = async () => {
    if (!selectedRequest || !actionType) return false;
    
    try {
      if (actionType === "accept") {
        await demandeInterventionService.createFromRequestAndDelete(selectedRequest.id);
        await fetchRequests();
        toast.success("Demande acceptée et intervention créée avec succès");
      } else if (actionType === "reject") {
        await demandeInterventionService.updateStatus(selectedRequest.id, "rejetée");
        setRequests(requests.filter(req => req.id !== selectedRequest.id));
        toast.success("Demande refusée avec succès");
      }

      setSelectedRequest(null);
      setActionType(null);

      return true;
    } catch (error: any) {
      console.error("Erreur lors de la gestion de la demande:", error);
      useToastHook({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour.",
      });
      throw error;
    }
  };

  return {
    loading,
    requests,
    selectedRequest,
    actionType,
    handleAccept,
    handleReject,
    confirmAction,
    refreshRequests: fetchRequests
  };
};
