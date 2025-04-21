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
const updatePVStatus = async (pvId: string, validationClient: boolean | null, commentaire?: string) => {
  try {
    const { data, error } = await supabase
      .from('pv_interventions')
      .update({
        validation_client: validationClient,
        date_validation: validationClient !== null ? new Date().toISOString() : null,
        commentaire
      })
      .eq('id', pvId)
      .select();

    if (error) {
      console.error("Erreur lors de la mise à jour du PV:", error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Exception lors de la mise à jour du PV:", error);
    throw error;
  }
};

// Fonction utilitaire pour extraire l'ID client sous forme string (sécurisée et stricte)
const extractClientId = (
  clientIdInput: string | { id: string } | null | undefined
): string => {
  if (!clientIdInput) {
    throw new Error("L'ID du client est requis pour la création de PV.");
  }

  if (typeof clientIdInput === "string") {
    if (!clientIdInput) throw new Error("Le champ clientId ne peut pas être vide.");
    return clientIdInput;
  }
  if (typeof clientIdInput === "object" && clientIdInput !== null && "id" in clientIdInput) {
    if (typeof clientIdInput.id === "string" && clientIdInput.id)
      return clientIdInput.id;
    throw new Error("L'objet clientId doit posséder un champ 'id' non vide.");
  }
  throw new Error(
    `Format d'ID client invalide: ${JSON.stringify(clientIdInput)}`
  );
};

// Créer un PV avec sécurisation stricte sur les ids
const createPv = async (pvData: Partial<PVIntervention>) => {
  try {
    // Vérification stricte sur interventionId et clientId
    if (!pvData.interventionId) {
      throw new Error("L'ID de l'intervention est requis");
    }
    if (!pvData.clientId) {
      throw new Error("L'ID du client est requis");
    }

    const clientIdValue = extractClientId(pvData.clientId);

    // Transformer les propriétés camelCase en snake_case pour la base de données
    const dbData = {
      intervention_id: pvData.interventionId,
      client_id: clientIdValue,
      validation_client: pvData.validation_client,
      commentaire: pvData.commentaire,
    };

    console.log("Données de création PV envoyées :", dbData);

    const { data, error } = await supabase
      .from("pv_interventions")
      .insert([dbData])
      .select()
      .maybeSingle();

    if (error) {
      console.error("Erreur lors de la création du PV:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Exception lors de la création du PV:", error);
    throw error;
  }
};

// Mettre à jour le rapport d'intervention
const updateInterventionReport = async (interventionId: string, rapport: string) => {
  try {
    const { data, error } = await supabase
      .from('interventions')
      .update({ rapport })
      .eq('id', interventionId)
      .select();

    if (error) {
      console.error("Erreur lors de la mise à jour du rapport:", error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Exception lors de la mise à jour du rapport:", error);
    throw error;
  }
};

export const pvInterventionService = {
  getPVsByClientId,
  getPVById,
  updatePVStatus,
  createPv,
  updateInterventionReport,
  extractClientId,
};
