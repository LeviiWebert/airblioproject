
import { supabase } from '@/integrations/supabase/client';

// Function to get all team monitoring entries
const getAll = async () => {
  const { data, error } = await supabase
    .from('suivi_equipes')
    .select('*');
  
  if (error) throw error;
  return data;
};

// Function to get team monitoring by ID
const getById = async (id: string) => {
  const { data, error } = await supabase
    .from('suivi_equipes')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

// Export the service functions
export const suiviEquipeService = {
  getAll,
  getById
};
