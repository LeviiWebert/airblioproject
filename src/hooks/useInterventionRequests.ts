
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
    console.log("🔄 Chargement des demandes d'intervention en attente...");
    setLoading(true);
    try {
      const data = await demandeInterventionService.getPending();
      console.log("✅ Demandes d'intervention récupérées:", data);
      setRequests(data || []);
    } catch (error) {
      console.error("❌ Erreur lors du chargement des demandes:", error);
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
    console.log("👆 Sélection de la demande pour acceptation:", request);
    setSelectedRequest(request);
    setActionType("accept");
  };

  const handleReject = (request: any) => {
    console.log("👆 Sélection de la demande pour rejet:", request);
    setSelectedRequest(request);
    setActionType("reject");
  };

  // Fonction pour confirmer l'action (accept/reject)
  const confirmAction = async (comment?: string) => {
    if (!selectedRequest || !actionType) {
      console.error("❌ Aucune demande ou action sélectionnée");
      return false;
    }
    
    // Vérifier si un commentaire est fourni pour le rejet
    if (actionType === "reject") {
      if (!comment?.trim()) {
        console.error("❌ Commentaire obligatoire pour le rejet");
        useToastHook({
          variant: "destructive",
          title: "Commentaire requis",
          description: "Veuillez fournir un motif pour le refus de la demande.",
        });
        return false;
      }
    }
    
    console.log(`🔄 Début de l'action: ${actionType} pour la demande ID: ${selectedRequest.id}`);
    console.log(`Commentaire de refus: ${comment || 'Non fourni'}`);
    setProcessing(true);
    
    try {
      if (actionType === "accept") {
        console.log("🔄 Acceptation de la demande et création d'intervention...");
        
        // Créer l'intervention basée sur la demande et marquer comme validée au lieu de supprimer
        const newIntervention = await demandeInterventionService.createFromRequestAndAccept(selectedRequest.id);
        console.log("✅ Intervention créée avec succès:", newIntervention);
        
        // Vérification des données de l'intervention
        if (!newIntervention || !newIntervention.id) {
          console.error("⚠️ L'intervention a été créée mais les données retournées sont incomplètes");
        }
        
        // Mettre à jour l'interface en supprimant la demande traitée
        setRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
        
        toast.success("Demande acceptée et intervention créée avec succès");
        setProcessing(false);
        
        console.log("✅ Processus d'acceptation terminé avec succès");
        return true;
      } else if (actionType === "reject") {
        console.log("🔄 Rejet de la demande...");
        console.log("Motif de rejet fourni:", comment);
        
        // Rejeter la demande avec le commentaire
        await demandeInterventionService.updateStatus(selectedRequest.id, "rejetée", comment);
        console.log("✅ Demande rejetée avec succès, statut mis à jour et motif enregistré");
        
        // Mettre à jour l'interface en supprimant la demande traitée
        setRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
        
        toast.success("Demande refusée avec succès");
        setProcessing(false);
        
        console.log("✅ Processus de rejet terminé avec succès");
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error("❌ Erreur lors de la gestion de la demande:", error);
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
