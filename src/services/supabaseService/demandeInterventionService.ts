
import { supabase } from '@/integrations/supabase/client';

// Function to get all intervention requests
const getAll = async () => {
  const { data, error } = await supabase
    .from('demande_interventions')
    .select('*');
  
  if (error) throw error;
  return data;
};

// Function to get all pending intervention requests
const getPending = async () => {
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
  return data;
};

// Function to get an intervention request by ID
const getById = async (id: string) => {
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
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

// Function to create a new intervention request
const create = async (demandeData: any) => {
  // Remove any fields not in the demande_interventions table
  const { localisation, ...validData } = demandeData;
  
  console.log("Sanitized data for demande_interventions:", validData);
  
  const { data, error } = await supabase
    .from('demande_interventions')
    .insert([validData])
    .select();
  
  if (error) throw error;
  return data[0];
};

// Function to update the status of an intervention request
const updateStatus = async (id: string, status: string) => {
  console.log(`Updating status for demande ${id} to ${status}`);
  
  const { data, error } = await supabase
    .from('demande_interventions')
    .update({ statut: status })
    .eq('id', id)
    .select();
  
  if (error) {
    console.error("Erreur lors de la mise à jour du statut de la demande:", error);
    throw error;
  }
  console.log("Statut de la demande mis à jour avec succès:", data);
  return data[0];
};

// Function to update intervention_id of a request
const updateInterventionId = async (id: string, interventionId: string) => {
  console.log(`Linking intervention ${interventionId} to demande ${id}`);
  
  const { data, error } = await supabase
    .from('demande_interventions')
    .update({ intervention_id: interventionId })
    .eq('id', id)
    .select();
  
  if (error) {
    console.error("Erreur lors de la liaison de l'intervention à la demande:", error);
    throw error;
  }
  console.log("Demande liée à l'intervention avec succès:", data);
  return data[0];
};

// Create an intervention from a demande then delete the demande
const createFromRequestAndDelete = async (demandeId: string) => {
  try {
    console.log(`Starting process for demande ${demandeId}: create intervention and delete demande`);
    
    // 1. Récupérer la demande complète avec les informations du client
    const { data: demande, error: demandeError } = await supabase
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
      .eq('id', demandeId)
      .maybeSingle();

    if (demandeError) {
      console.error("Erreur lors de la récupération de la demande:", demandeError);
      throw demandeError;
    }
    
    if (!demande) {
      console.error("Demande non trouvée avec l'ID:", demandeId);
      throw new Error("Demande non trouvée");
    }

    console.log("Demande récupérée avec succès:", demande);

    // 2. Créer l'intervention avec les données valides pour la table interventions
    // S'assurer de n'utiliser que les colonnes qui existent dans la table interventions
    const interventionData = {
      demande_intervention_id: demande.id,
      statut: 'planifiée',
      localisation: 'À déterminer',
      rapport: '',
      date_debut: null,
      date_fin: null
    };

    console.log("Données pour la nouvelle intervention:", interventionData);
    
    // Vérifier la structure attendue de la table
    console.log("Structure attendue de la table interventions:", {
      id: "UUID (auto)",
      demande_intervention_id: "UUID (référence vers demande_interventions)",
      statut: "string ('planifiée', 'en_cours', 'terminée', 'annulée')",
      localisation: "string",
      rapport: "string (nullable)",
      date_debut: "timestamp (nullable)",
      date_fin: "timestamp (nullable)",
      created_at: "timestamp (auto)",
      updated_at: "timestamp (auto)",
      facturation_id: "UUID (nullable)",
      pv_intervention_id: "UUID (nullable)"
    });
    
    // Insérer l'intervention dans la base de données
    const { data: intervention, error: interventionError } = await supabase
      .from('interventions')
      .insert([interventionData])
      .select();

    if (interventionError) {
      console.error("Erreur lors de la création de l'intervention:", interventionError);
      console.error("Détails de l'erreur:", interventionError.details);
      console.error("Message d'erreur:", interventionError.message);
      console.error("Code d'erreur:", interventionError.code);
      throw interventionError;
    }
    
    if (!intervention || intervention.length === 0) {
      console.error("Intervention non créée, résultat vide");
      throw new Error("Erreur lors de la création de l'intervention");
    }

    console.log("Intervention créée avec succès:", intervention[0]);

    // Attendre un moment pour assurer que l'intervention a été enregistrée
    await new Promise(resolve => setTimeout(resolve, 800));

    // 3. Supprimer la demande
    console.log("Suppression de la demande avec l'ID:", demandeId);
    const { error: deleteError } = await supabase
      .from('demande_interventions')
      .delete()
      .eq('id', demandeId);

    if (deleteError) {
      console.error("Erreur lors de la suppression de la demande:", deleteError);
      throw deleteError;
    }

    console.log("Demande supprimée avec succès, processus terminé");
    return intervention[0];
  } catch (error) {
    console.error("Erreur globale dans createFromRequestAndDelete:", error);
    throw error;
  }
};

// Export with the new method
export const demandeInterventionService = {
  getAll,
  getPending,
  getById,
  create,
  updateStatus,
  updateInterventionId,
  createFromRequestAndDelete,
};
