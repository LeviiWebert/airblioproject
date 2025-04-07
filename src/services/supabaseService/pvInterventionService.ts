
import { supabase } from "@/integrations/supabase/client";
import { PVIntervention } from "@/types/models";

// Récupérer les PV d'un client
const getPVsByClientId = async (clientId: string) => {
  const { data, error } = await supabase
    .from('pv_interventions')
    .select(`
      id,
      validation_client,
      date_validation,
      commentaire,
      client_id,
      intervention_id,
      created_at,
      intervention:interventions (
        id,
        date_fin,
        rapport,
        localisation,
        statut
      )
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Récupérer un PV par son ID
const getPVById = async (pvId: string) => {
  const { data, error } = await supabase
    .from('pv_interventions')
    .select(`
      id,
      validation_client,
      date_validation,
      commentaire,
      client_id,
      intervention_id,
      created_at,
      intervention:interventions (
        id,
        date_fin,
        rapport,
        localisation,
        statut
      )
    `)
    .eq('id', pvId)
    .single();

  if (error) throw error;
  return data;
};

// Mettre à jour un PV (validation par le client)
const updatePVStatus = async (pvId: string, validationClient: boolean, commentaire?: string) => {
  const { data, error } = await supabase
    .from('pv_interventions')
    .update({
      validation_client: validationClient,
      date_validation: new Date().toISOString(),
      commentaire
    })
    .eq('id', pvId)
    .select();

  if (error) throw error;
  return data;
};

export const pvInterventionService = {
  getPVsByClientId,
  getPVById,
  updatePVStatus
};
