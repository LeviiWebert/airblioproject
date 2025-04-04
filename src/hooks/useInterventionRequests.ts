
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      const { data, error } = await supabase
        .from('demande_interventions')
        .select(`
          *,
          client:client_id (
            id,
            nom_entreprise,
            email,
            tel
          )
        `)
        .eq('statut', 'en_attente');
        
      if (error) throw error;
      
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
    if (!selectedRequest || !actionType) return;
    
    try {
      // Déterminer le nouveau statut
      const newStatus = actionType === "accept" ? "validée" : "rejetée";
      
      // Mettre à jour le statut de la demande dans Supabase
      const { error } = await supabase
        .from('demande_interventions')
        .update({ statut: newStatus })
        .eq('id', selectedRequest.id);
      
      if (error) throw error;
      
      // Mettre à jour l'interface utilisateur
      setRequests(requests.filter(req => req.id !== selectedRequest.id));
      
      // Si la demande est acceptée, créer une intervention
      if (actionType === "accept") {
        // Ici, vous pourriez ajouter le code pour créer une nouvelle intervention
        // Exemple: appeler un service ou insérer directement dans Supabase
      }
      
      // Réinitialiser l'état
      setSelectedRequest(null);
      setActionType(null);
      
      return true;
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de la demande:", error);
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
    confirmAction
  };
};
