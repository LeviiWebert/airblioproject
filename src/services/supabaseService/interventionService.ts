import { supabase } from '@/integrations/supabase/client';

// Get all interventions
const getAll = async () => {
  const { data, error } = await supabase
    .from('interventions')
    .select(`
      *,
      demande_intervention_id(*, client_id(*))
    `);
  
  if (error) throw error;
  return data;
};

// Get intervention by ID
const getById = async (id: string) => {
  const { data, error } = await supabase
    .from('interventions')
    .select(`
      *,
      demande_intervention_id(*, client_id(*)),
      intervention_equipes(equipe_id(*)),
      intervention_materiels(materiel_id(*))
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;

  // Transform the data to match the expected structure
  if (data) {
    const teams = data.intervention_equipes ? data.intervention_equipes.map((item: any) => item.equipe_id) : [];
    const equipment = data.intervention_materiels ? data.intervention_materiels.map((item: any) => item.materiel_id) : [];

    return {
      ...data,
      demande: data.demande_intervention_id,
      teams: teams,
      equipment: equipment
    };
  }

  return data;
};

// Create a new intervention
const createIntervention = async (interventionData: any) => {
  const { data, error } = await supabase
    .from('interventions')
    .insert([interventionData])
    .select();
  
  if (error) throw error;
  return data[0];
};

// Update intervention
const updateIntervention = async (id: string, interventionData: any) => {
  const { data, error } = await supabase
    .from('interventions')
    .update(interventionData)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
};

// Update intervention status
const updateStatus = async (id: string, status: string) => {
  const { data, error } = await supabase
    .from('interventions')
    .update({ statut: status })
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
};

// Update intervention teams
const updateTeams = async (interventionId: string, teamIds: string[]) => {
  try {
    // First, delete all current team associations
    const { error: deleteError } = await supabase
      .from('intervention_equipes')
      .delete()
      .eq('intervention_id', interventionId);
    
    if (deleteError) throw deleteError;
    
    // If there are teams to add, insert them
    if (teamIds.length > 0) {
      const teamAssociations = teamIds.map(teamId => ({
        intervention_id: interventionId,
        equipe_id: teamId
      }));
      
      const { error: insertError } = await supabase
        .from('intervention_equipes')
        .insert(teamAssociations);
      
      if (insertError) throw insertError;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des équipes:', error);
    throw error;
  }
};

// Delete intervention
const deleteIntervention = async (id: string) => {
  const { error } = await supabase
    .from('interventions')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

// Export all functions
export const interventionService = {
  getAll,
  getById,
  createIntervention,
  updateIntervention,
  updateStatus,
  updateTeams,
  deleteIntervention
};
