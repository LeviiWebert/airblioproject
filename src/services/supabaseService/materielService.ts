
import { supabase } from '@/integrations/supabase/client';

// Function to get all equipment
const getAll = async () => {
  const { data, error } = await supabase
    .from('materiels')
    .select('*');
  
  if (error) throw error;
  return data;
};

// Function to get equipment by ID
const getById = async (id: string) => {
  const { data, error } = await supabase
    .from('materiels')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

// Export the service functions
export const materielService = {
  getAll,
  getById
};
