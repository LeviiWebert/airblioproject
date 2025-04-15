
import { supabase } from '@/integrations/supabase/client';

// Function to get all equipment monitoring entries
const getAll = async () => {
  const { data, error } = await supabase
    .from('suivi_materiels')
    .select('*');
  
  if (error) throw error;
  return data;
};

// Function to get equipment monitoring by ID
const getById = async (id: string) => {
  const { data, error } = await supabase
    .from('suivi_materiels')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

// Export the service functions
export const suiviMaterielService = {
  getAll,
  getById
};
