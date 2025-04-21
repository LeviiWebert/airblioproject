
import { supabase } from '@/integrations/supabase/client';

// Function to get all intervention requests
const getAll = async () => {
  const { data, error } = await supabase
    .from('demande_interventions')
    .select('*');
  
  if (error) throw error;
  return data;
};

// Function to get an intervention request by ID
const getById = async (id: string) => {
  const { data, error } = await supabase
    .from('demande_interventions')
    .select('*')
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

// Export the service functions
export const demandeInterventionService = {
  getAll,
  getById,
  create
};
