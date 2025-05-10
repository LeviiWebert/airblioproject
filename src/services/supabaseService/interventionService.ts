
import { supabase } from '@/integrations/supabase/client';
import { FilterOptions } from '@/types/models';

// Get all interventions
const getAll = async () => {
  console.log("🔄 Récupération de toutes les interventions");
  const { data, error } = await supabase
    .from('interventions')
    .select(`
      *,
      demande_intervention_id(*, client_id(*))
    `)
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error("❌ Erreur lors de la récupération des interventions:", error);
    throw error;
  }
  
  console.log(`✅ ${data?.length || 0} interventions récupérées`);
  return data;
};

// Get detailed interventions with filtering options
const getDetailedInterventions = async (filterOptions: FilterOptions = {}) => {
  try {
    console.log("🔄 Récupération des interventions détaillées avec filtres:", filterOptions);
    
    // Modification de la requête pour permettre les jointures externes (LEFT JOIN) 
    // au lieu des jointures internes (INNER JOIN) avec demande_intervention_id
    let query = supabase
      .from('interventions')
      .select(`
        id,
        date_debut,
        date_fin,
        localisation,
        rapport,
        statut,
        demande_intervention_id (
          id, 
          description,
          urgence,
          client_id (
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
      // Si la demande d'intervention existe, filtre par client
      query = query.or(`demande_intervention_id.client_id.eq.${filterOptions.client},demande_intervention_id.is.null`);
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
        console.log("⚠️ Aucune intervention ne correspond à l'équipe sélectionnée");
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
      console.error("❌ Erreur lors de la récupération des interventions détaillées:", error);
      throw error;
    }
    
    console.log(`✅ ${data?.length || 0} interventions détaillées récupérées avant formatage`, data);
    
    // Format data for easier consumption
    const formattedData = data.map(intervention => {
      // Extract teams from intervention_equipes
      const teams = intervention.intervention_equipes
        ? intervention.intervention_equipes
            .filter(item => item.equipe_id)
            .map(item => item.equipe_id)
        : [];
      
      // Si la demande_intervention_id est null (a été supprimée), créer des valeurs par défaut
      const demande = intervention.demande_intervention_id || { 
        id: null, 
        description: "Demande initiale supprimée", 
        urgence: "moyenne" 
      };
      
      // Traiter séparément les informations du client
      let client = { id: null, nom_entreprise: "Client inconnu" };
      
      // Ne vérifier client_id que si demande existe et a cette propriété
      if (demande && 'client_id' in demande && demande.client_id) {
        client = demande.client_id;
      }
      
      return {
        id: intervention.id,
        dateDebut: intervention.date_debut,
        dateFin: intervention.date_fin,
        localisation: intervention.localisation,
        rapport: intervention.rapport,
        statut: intervention.statut,
        demande: {
          id: demande.id,
          description: demande.description,
          urgence: demande.urgence
        },
        client: {
          id: client.id,
          nomEntreprise: client.nom_entreprise
        },
        equipes: teams
      };
    });
    
    console.log(`✅ Retour de ${formattedData.length} interventions formatées`);
    return formattedData;
  } catch (error) {
    console.error("❌ Erreur dans getDetailedInterventions:", error);
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
