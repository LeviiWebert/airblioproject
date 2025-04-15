
import { supabase } from '@/integrations/supabase/client';

// Function to get all teams
const getAll = async () => {
  const { data, error } = await supabase
    .from('equipes')
    .select('*');
  
  if (error) throw error;
  return data;
};

// Function to get a team by ID
const getById = async (id: string) => {
  const { data, error } = await supabase
    .from('equipes')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

// Export the service functions
export const equipeService = {
  getAll,
  getById
};
