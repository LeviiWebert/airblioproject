
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

// Fonction simplifiée pour créer une intervention à partir d'une demande puis supprimer la demande
const createFromRequestAndDelete = async (demandeId: string) => {
  try {
    console.log(`Création d'intervention à partir de la demande ${demandeId}`);
    
    // 1. Récupérer les informations de la demande
    const { data: demande, error: demandeError } = await supabase
      .from('demande_interventions')
      .select('*')
      .eq('id', demandeId)
      .single();

    if (demandeError) {
      console.error("Erreur lors de la récupération de la demande:", demandeError);
      throw new Error("Impossible de récupérer la demande d'intervention");
    }
    
    console.log("Demande récupérée:", demande);

    // 2. Créer l'intervention (avec le minimum de champs nécessaires)
    const interventionData = {
      demande_intervention_id: demande.id,
      statut: 'planifiée',
      localisation: 'À définir',
      rapport: null
    };
    
    console.log("Données d'intervention à créer:", interventionData);
    
    const { data: intervention, error: interventionError } = await supabase
      .from('interventions')
      .insert([interventionData])
      .select();

    if (interventionError) {
      console.error("Erreur lors de la création de l'intervention:", interventionError);
      throw new Error("Impossible de créer l'intervention");
    }
    
    console.log("Intervention créée avec succès:", intervention);

    // 3. Supprimer la demande d'origine
    const { error: deleteError } = await supabase
      .from('demande_interventions')
      .delete()
      .eq('id', demandeId);

    if (deleteError) {
      console.error("Erreur lors de la suppression de la demande:", deleteError);
      throw new Error("L'intervention a été créée mais la demande n'a pas pu être supprimée");
    }

    console.log("Demande supprimée avec succès");
    return intervention[0];
  } catch (error) {
    console.error("Erreur globale dans createFromRequestAndDelete:", error);
    throw error;
  }
};

// Export all functions
export const demandeInterventionService = {
  getAll,
  getPending,
  getById,
  create,
  updateStatus,
  createFromRequestAndDelete
};
