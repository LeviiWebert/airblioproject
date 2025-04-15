
import { supabase } from '@/integrations/supabase/client';

// Function to get all users
const getAll = async () => {
  const { data, error } = await supabase
    .from('utilisateurs')
    .select('*');
  
  if (error) throw error;
  return data;
};

// Function to get a user by ID
const getById = async (id: string) => {
  const { data, error } = await supabase
    .from('utilisateurs')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

// Export the service functions
export const utilisateurService = {
  getAll,
  getById
};
