
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

// Export the service functions
export const demandeInterventionService = {
  getAll,
  getPending,
  getById,
  create,
  updateStatus,
  updateInterventionId
};
