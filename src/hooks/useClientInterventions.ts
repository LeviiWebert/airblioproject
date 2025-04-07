
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export const useClientInterventions = () => {
  const { toast } = useToast();
  const { user, clientId } = useAuth();
  const [interventions, setInterventions] = useState<any[]>([]);
  const [techniciens, setTechniciens] = useState<any[]>([]);
  const [clientData, setClientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndInterventions = async () => {
      if (!user || !clientId) {
        console.log("Pas d'utilisateur ou d'ID client disponible");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Chargement des données pour le client ID:", clientId);
        
        // Récupérer les informations du client
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .maybeSingle();
          
        if (clientError) {
          console.error("Erreur lors de la récupération des données client:", clientError);
          toast({
            variant: "destructive", 
            title: "Erreur",
            description: "Impossible de charger vos informations client."
          });
        } else if (clientData) {
          setClientData(clientData);
        }
        
        // Récupérer toutes les demandes d'intervention du client
        const { data: demandesData, error: demandesError } = await supabase
          .from('demande_interventions')
          .select(`
            id,
            date_demande,
            description,
            urgence,
            statut,
            intervention_id,
            interventions:intervention_id (
              id,
              date_debut,
              date_fin,
              rapport,
              localisation,
              statut
            )
          `)
          .eq('client_id', clientId)
          .order('date_demande', { ascending: false });
          
        if (demandesError) {
          console.error("Erreur lors de la récupération des demandes:", demandesError);
          toast({
            variant: "destructive", 
            title: "Erreur",
            description: "Impossible de charger vos interventions."
          });
          setError("Impossible de charger vos interventions.");
        } else {
          setInterventions(demandesData || []);
          
          // Récupérer les équipes d'intervention pour les demandes
          if (demandesData && demandesData.length > 0) {
            // Filtrer pour ne récupérer que les interventions qui ont un ID
            const interventionIds = demandesData
              .filter(demande => demande.intervention_id)
              .map(demande => demande.intervention_id);
              
            if (interventionIds.length > 0) {
              // Récupérer les équipes par intervention
              const { data: interventionEquipes, error: equipesError } = await supabase
                .from('intervention_equipes')
                .select(`
                  equipe_id,
                  intervention_id,
                  equipes:equipe_id (
                    id,
                    nom,
                    specialisation
                  )
                `)
                .in('intervention_id', interventionIds);
                
              if (equipesError) {
                console.error("Erreur lors de la récupération des équipes:", equipesError);
              } else if (interventionEquipes && interventionEquipes.length > 0) {
                const equipeIds = interventionEquipes
                  .map(ie => ie.equipe_id)
                  .filter((id): id is string => id !== null);
                
                if (equipeIds.length > 0) {
                  // Récupérer les membres des équipes
                  const { data: equipeMembres, error: equipeMembresError } = await supabase
                    .from('equipe_membres')
                    .select(`
                      equipe_id,
                      utilisateur:utilisateur_id (
                        id,
                        nom,
                        role,
                        email,
                        disponibilite
                      )
                    `)
                    .in('equipe_id', equipeIds);
                    
                  if (equipeMembresError) {
                    console.error("Erreur lors de la récupération des membres d'équipe:", equipeMembresError);
                  } else if (equipeMembres) {
                    // Extraire les techniciens uniques par ID
                    const technicienMap = new Map();
                    equipeMembres.forEach((membre: any) => {
                      if (membre.utilisateur && membre.utilisateur.role === 'technicien') {
                        technicienMap.set(membre.utilisateur.id, membre.utilisateur);
                      }
                    });
                    
                    setTechniciens(Array.from(technicienMap.values()));
                  }
                }
              }
            }
          }
        }
      } catch (error: any) {
        console.error("Erreur générale lors du chargement des données:", error);
        toast({
          variant: "destructive", 
          title: "Erreur",
          description: "Impossible de charger vos interventions. Veuillez réessayer ultérieurement."
        });
        setError("Erreur lors du chargement des données. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    };
    
    if (clientId) {
      fetchUserAndInterventions();
    } else {
      setLoading(false);
    }
  }, [toast, user, clientId]);

  const getInterventionsByStatus = (status: string) => {
    return interventions.filter(intervention => intervention.statut === status);
  };

  const getPendingInterventions = () => {
    return interventions.filter(intervention => 
      ["en_attente", "en_cours_analyse", "validée"].includes(intervention.statut)
    );
  };

  const getActiveInterventions = () => {
    return interventions.filter(intervention => 
      intervention.intervention_id && 
      intervention.interventions?.statut && 
      ["planifiée", "en_cours"].includes(intervention.interventions.statut)
    );
  };

  const getCompletedInterventions = () => {
    return interventions.filter(intervention => 
      intervention.intervention_id && 
      intervention.interventions?.statut && 
      ["terminée"].includes(intervention.interventions.statut)
    );
  };

  const getRejectedInterventions = () => {
    return interventions.filter(intervention => 
      intervention.statut === "rejetée"
    );
  };

  return {
    loading,
    error,
    interventions,
    techniciens,
    clientData,
    getPendingInterventions,
    getActiveInterventions,
    getCompletedInterventions,
    getRejectedInterventions,
    getInterventionsByStatus
  };
};
