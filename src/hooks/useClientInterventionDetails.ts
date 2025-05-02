import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Types mirroring InterventionDetails.tsx
export interface Intervention {
  id: string;
  date_debut: string | null;
  date_fin: string | null;
  rapport: string | null;
  statut: string;
  localisation: string;
  pv_intervention_id: string | null;
  pv_interventions?: any;
  intervention_equipes?: any[];
  intervention_materiels?: any[];
}

export interface DemandeIntervention {
  id: string;
  description: string;
  date_demande: string;
  urgence: string;
  statut: string;
  motif_rejet?: string;
  intervention_id: string | null;
  client_id: string;
  intervention?: Intervention;
}

export const useClientInterventionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const { user, clientId } = useAuth();

  const [demande, setDemande] = useState<DemandeIntervention | null>(null);
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancellingDemande, setCancellingDemande] = useState(false);
  const [materiels, setMateriels] = useState<any[]>([]);

  useEffect(() => {
    const fetchInterventionDetails = async () => {
      try {
        if (!id) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth');
          return;
        }
        if (!clientId) {
          uiToast({
            variant: "destructive",
            title: "Accès refusé",
            description: "Profil client non trouvé. Veuillez vous reconnecter."
          });
          navigate('/auth');
          return;
        }
        setAuthChecked(true);

        const { data: demandeData, error: demandeError } = await supabase
          .from('demande_interventions')
          .select(`
            id,
            description,
            date_demande,
            urgence,
            statut,
            motif_rejet,
            intervention_id,
            client_id
          `)
          .eq('id', id)
          .single();

        if (demandeError) throw demandeError;
        if (demandeData.client_id !== clientId) {
          uiToast({
            variant: "destructive",
            title: "Accès refusé",
            description: "Vous n'êtes pas autorisé à consulter cette intervention."
          });
          navigate('/client/interventions');
          return;
        }

        setDemande(demandeData);

        if (demandeData.intervention_id) {
          const { data: interventionData, error: interventionError } = await supabase
            .from('interventions')
            .select(`
              id,
              date_debut,
              date_fin,
              rapport,
              statut,
              localisation,
              pv_intervention_id
            `)
            .eq('id', demandeData.intervention_id)
            .single();

          if (interventionError) throw interventionError;
          setIntervention(interventionData);

          // Load PV
          if (interventionData.pv_intervention_id) {
            const { data: pvData, error: pvError } = await supabase
              .from('pv_interventions')
              .select(`
                id,
                validation_client,
                date_validation,
                commentaire
              `)
              .eq('id', interventionData.pv_intervention_id)
              .single();
            if (!pvError && pvData) {
              setIntervention(prev => ({
                ...prev!,
                pv_interventions: pvData
              }));
              if (pvData.commentaire) setFeedback(pvData.commentaire);
            }
          }

          // Teams
          const { data: equipesData } = await supabase
            .from('intervention_equipes')
            .select(`
              equipe_id,
              equipes:equipe_id (
                id,
                nom,
                specialisation
              )
            `)
            .eq('intervention_id', demandeData.intervention_id);
          if (equipesData) {
            setIntervention(prev => ({
              ...prev!,
              intervention_equipes: equipesData
            }));
          }

          // Materiels
          const { data: materielsData } = await supabase
            .from('intervention_materiels')
            .select(`
              materiel_id,
              materiels:materiel_id (
                id,
                reference,
                type_materiel,
                etat
              )
            `)
            .eq('intervention_id', demandeData.intervention_id);
          if (materielsData) {
            setMateriels(materielsData);
            setIntervention(prev => ({
              ...prev!,
              intervention_materiels: materielsData
            }));
          }
        }
      } catch (error) {
        uiToast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les détails de l'intervention."
        });
        navigate('/client/interventions');
      } finally {
        setLoading(false);
      }
    };

    fetchInterventionDetails();
  }, [id, navigate, uiToast, clientId]);

  const refreshInterventionData = useCallback(() => {
    setLoading(true);
    setDemande(null);
    setIntervention(null);
    setFeedback("");
    setMateriels([]);
    // re-fetch data by calling useEffect
  }, []);

  const handleValidateIntervention = async (validate: boolean) => {
    try {
      setSubmitting(true);
      if (!intervention?.pv_intervention_id) {
        uiToast({
          variant: "destructive",
          title: "Erreur",
          description: "Aucun PV d'intervention à valider."
        });
        return;
      }
      const { error } = await supabase
        .from('pv_interventions')
        .update({
          validation_client: validate,
          date_validation: new Date().toISOString(),
          commentaire: feedback
        })
        .eq('id', intervention.pv_intervention_id);
      if (error) throw error;
      sonnerToast(validate
        ? "Intervention validée"
        : "Votre retour a été enregistré.");
    } catch {
      uiToast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de valider l'intervention."
      });
    } finally {
      setSubmitting(false);
      // Optionally refresh
    }
  };

  const handleCancelDemande = async () => {
    if (!demande) return;
    try {
      setCancellingDemande(true);
      // Only allow certain statut values: en_attente, en_cours_analyse, validée, rejetée, terminée
      // Use a valid value, e.g. 'rejetée' for canceled
      const { error } = await supabase
        .from('demande_interventions')
        .update({ statut: 'rejetée' })
        .eq('id', demande.id);

      if (error) throw error;
      setDemande(prev => prev ? { ...prev, statut: 'rejetée' } : null);
      sonnerToast("Votre demande d'intervention a été annulée");
    } catch {
      sonnerToast("Impossible d'annuler la demande d'intervention");
    } finally {
      setCancellingDemande(false);
    }
  };

  return {
    demande,
    intervention,
    loading,
    authChecked,
    feedback,
    setFeedback,
    submitting,
    handleValidateIntervention,
    cancellingDemande,
    handleCancelDemande,
    materiels,
  };
};
