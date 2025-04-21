
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
  try {
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
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération du PV:", error);
    throw error;
  }
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

// Créer un PV
const createPv = async (pvData: Partial<PVIntervention>) => {
  // Transformer les propriétés camelCase en snake_case pour la base de données
  const dbData = {
    intervention_id: pvData.interventionId,
    client_id: pvData.clientId,
    validation_client: pvData.validation_client,
    commentaire: pvData.commentaire
  };

  const { data, error } = await supabase
    .from('pv_interventions')
    .insert([dbData])
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const pvInterventionService = {
  getPVsByClientId,
  getPVById,
  updatePVStatus,
  createPv
};
