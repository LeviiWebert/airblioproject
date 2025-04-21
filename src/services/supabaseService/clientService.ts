
import { supabase } from '@/integrations/supabase/client';

// Function to get all clients
export const getAll = async () => {
  const { data, error } = await supabase
    .from('clients')
    .select('*');
  
  if (error) {
    console.error("Erreur lors de la récupération des clients:", error);
    throw error;
  }
  
  console.log("Clients récupérés:", data);
  return data;
};

// Function to get a client by ID
export const getById = async (id: string) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

// Function to create a client
export const createClient = async (clientData: { 
  nom_entreprise: string; 
  email?: string | null; 
  tel?: string | null;
  identifiant?: string | null;
  mdp?: string | null;
}) => {
  const { data, error } = await supabase
    .from('clients')
    .insert([clientData])
    .select();
  
  if (error) throw error;
  return data[0];
};

// Function to update a client
export const updateClient = async (
  id: string,
  clientData: { 
    nom_entreprise?: string; 
    email?: string | null; 
    tel?: string | null;
    identifiant?: string | null;
    mdp?: string | null;
  }
) => {
  const { data, error } = await supabase
    .from('clients')
    .update(clientData)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
};

// Function to delete a client
export const deleteClient = async (id: string) => {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

// Export the service functions
export const clientService = {
  getAll,
  getById,
  createClient,
  updateClient,
  deleteClient
};
