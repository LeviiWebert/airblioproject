
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

// Function to create a new team
const createTeam = async (values: { nom: string; specialisation?: string }) => {
  const { data, error } = await supabase
    .from('equipes')
    .insert([
      {
        nom: values.nom,
        specialisation: values.specialisation || null,
      },
    ])
    .select();

  if (error) throw error;
  return data[0];
};

// Function to update a team
const updateTeam = async (id: string, values: { nom: string; specialisation?: string }) => {
  const { data, error } = await supabase
    .from('equipes')
    .update({
      nom: values.nom,
      specialisation: values.specialisation || null,
    })
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0];
};

// Function to delete a team
const deleteTeam = async (id: string) => {
  // First, delete any related records in equipe_membres
  const { error: membersError } = await supabase
    .from('equipe_membres')
    .delete()
    .eq('equipe_id', id);

  if (membersError) throw membersError;

  // Then delete the team
  const { error } = await supabase
    .from('equipes')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

// Export the service functions
export const equipeService = {
  getAll,
  getById,
  createTeam,
  updateTeam,
  deleteTeam
};
