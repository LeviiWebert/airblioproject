
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
      // Utiliser le service plutôt que l'appel direct à Supabase
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
      // Déterminer le nouveau statut
      const newStatus = actionType === "accept" ? "validée" : "rejetée";
      
      console.log(`Mise à jour du statut de la demande ${selectedRequest.id} à ${newStatus}`);
      
      // Utiliser le service pour la mise à jour
      await demandeInterventionService.updateStatus(selectedRequest.id, newStatus);
      
      // Mettre à jour l'interface utilisateur
      setRequests(requests.filter(req => req.id !== selectedRequest.id));
      
      // Si la demande est acceptée, créer une intervention
      if (actionType === "accept") {
        console.log("Création d'une nouvelle intervention pour la demande:", selectedRequest.id);
        
        // S'assurer que toutes les données pertinentes sont transférées
        const { data: intervention, error: interventionError } = await supabase
          .from('interventions')
          .insert([
            { 
              demande_intervention_id: selectedRequest.id,
              statut: 'planifiée',
              localisation: selectedRequest.localisation || 'À déterminer',
              rapport: '',
              // Garder toutes les données importantes de la demande
              date_debut: null,
              date_fin: null
            }
          ])
          .select()
          .single();
        
        if (interventionError) throw interventionError;
        
        console.log("Intervention créée avec succès:", intervention);
        
        // Mettre à jour la demande d'intervention avec l'ID de l'intervention
        await demandeInterventionService.updateInterventionId(selectedRequest.id, intervention.id);
        
        console.log("Demande mise à jour avec l'ID de l'intervention:", intervention.id);
      }
      
      // Notification de succès
      toast.success(
        actionType === "accept" 
          ? "Demande acceptée avec succès" 
          : "Demande refusée avec succès"
      );
      
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
    confirmAction,
    refreshRequests: fetchRequests
  };
};
