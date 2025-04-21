import { supabase } from '@/integrations/supabase/client';
import { FilterOptions } from '@/types/models';

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

// Get detailed interventions with filtering options
const getDetailedInterventions = async (filterOptions: FilterOptions = {}) => {
  try {
    console.log("Getting detailed interventions with filters:", filterOptions);
    
    let query = supabase
      .from('interventions')
      .select(`
        id,
        date_debut,
        date_fin,
        localisation,
        rapport,
        statut,
        demande_intervention_id!inner (
          id,
          description,
          urgence,
          client_id!inner (
            id,
            nom_entreprise
          )
        ),
        intervention_equipes (
          equipe_id (
            id,
            nom
          )
        )
      `);
    
    // Apply filters if they exist
    if (filterOptions.status) {
      query = query.eq('statut', filterOptions.status);
    }
    
    if (filterOptions.client) {
      query = query.eq('demande_intervention_id.client_id', filterOptions.client);
    }
    
    if (filterOptions.team) {
      // For team filtering, we need a different approach since it's a nested relation
      const { data: teamInterventions } = await supabase
        .from('intervention_equipes')
        .select('intervention_id')
        .eq('equipe_id', filterOptions.team);
      
      if (teamInterventions && teamInterventions.length > 0) {
        const interventionIds = teamInterventions.map(ti => ti.intervention_id);
        query = query.in('id', interventionIds);
      } else {
        // If no interventions match this team, return empty array early
        return [];
      }
    }
    
    // Apply date range filter if it exists
    if (filterOptions.dateRange?.from) {
      query = query.gte('date_debut', filterOptions.dateRange.from);
    }
    
    if (filterOptions.dateRange?.to) {
      query = query.lte('date_debut', filterOptions.dateRange.to);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching detailed interventions:", error);
      throw error;
    }
    
    // Format data for easier consumption
    const formattedData = data.map(intervention => {
      // Extract teams from intervention_equipes
      const teams = intervention.intervention_equipes
        ? intervention.intervention_equipes
            .filter(item => item.equipe_id)
            .map(item => item.equipe_id)
        : [];
      
      return {
        id: intervention.id,
        dateDebut: intervention.date_debut,
        dateFin: intervention.date_fin,
        localisation: intervention.localisation,
        rapport: intervention.rapport,
        statut: intervention.statut,
        demande: {
          id: intervention.demande_intervention_id.id,
          description: intervention.demande_intervention_id.description,
          urgence: intervention.demande_intervention_id.urgence
        },
        client: {
          id: intervention.demande_intervention_id.client_id.id,
          nomEntreprise: intervention.demande_intervention_id.client_id.nom_entreprise
        },
        equipes: teams
      };
    });
    
    console.log(`Returning ${formattedData.length} formatted interventions`);
    return formattedData;
  } catch (error) {
    console.error("Error in getDetailedInterventions:", error);
    throw error;
  }
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
  getDetailedInterventions,
  getById,
  createIntervention,
  updateIntervention,
  updateStatus,
  updateTeams,
  deleteIntervention
};
