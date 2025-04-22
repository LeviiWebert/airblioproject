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

// Fonction simplifiée pour créer une intervention à partir d'une demande
const createFromRequestAndDelete = async (demandeId: string) => {
  try {
    // 1. Créer l'intervention directement avec les informations minimales nécessaires
    const { data: intervention, error: interventionError } = await supabase
      .from('interventions')
      .insert([{
        demande_intervention_id: demandeId,
        statut: 'planifiée',
        localisation: 'À définir'
      }])
      .select()
      .single();

    if (interventionError) throw interventionError;

    // 2. Supprimer la demande d'origine
    const { error: deleteError } = await supabase
      .from('demande_interventions')
      .delete()
      .eq('id', demandeId);

    if (deleteError) throw deleteError;

    return intervention;
  } catch (error) {
    console.error("Erreur dans createFromRequestAndDelete:", error);
    throw error;
  }
};

export const demandeInterventionService = {
  getAll,
  getPending,
  getById,
  create,
  updateStatus,
  createFromRequestAndDelete
};
