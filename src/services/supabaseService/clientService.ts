
import { supabase } from '@/integrations/supabase/client';

// Function to get all clients
const getAll = async () => {
  const { data, error } = await supabase
    .from('clients')
    .select('*');
  
  if (error) throw error;
  return data;
};

// Function to get a client by ID
const getById = async (id: string) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

// Export the service functions
export const clientService = {
  getAll,
  getById
};
