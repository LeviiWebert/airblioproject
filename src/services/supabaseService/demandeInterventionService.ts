
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
  const { data, error } = await supabase
    .from('demande_interventions')
    .insert([demandeData])
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
