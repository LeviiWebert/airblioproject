import { supabase } from '@/integrations/supabase/client';

const getAll = async () => {
  const { data, error } = await supabase
    .from('interventions')
    .select(`
      id,
      date_debut,
      date_fin,
      localisation,
      statut,
      demande_intervention_id,
      demande_interventions:demande_intervention_id (
        description,
        urgence,
        client_id,
        clients:client_id (
          id,
          nom_entreprise
        )
      ),
      intervention_equipes (
        equipe_id,
        equipes:equipe_id (
          id,
          nom
        )
      )
    `);
    
  if (error) throw error;
  
  return data.map(item => ({
    id: item.id,
    dateDebut: item.date_debut ? new Date(item.date_debut) : null,
    dateFin: item.date_fin ? new Date(item.date_fin) : null,
    localisation: item.localisation,
    statut: item.statut,
    client: {
      id: item.demande_interventions?.clients?.id || '',
      nomEntreprise: item.demande_interventions?.clients?.nom_entreprise || 'Client inconnu'
    },
    demande: {
      description: item.demande_interventions?.description || '',
      urgence: item.demande_interventions?.urgence || 'basse'
    },
    equipes: item.intervention_equipes?.map(eq => ({
      id: eq.equipes?.id || '',
      nom: eq.equipes?.nom || 'Équipe inconnue'
    })) || []
  }));
};

const getById = async (id: string) => {
  const { data, error } = await supabase
    .from('interventions')
    .select(`
      id,
      date_debut,
      date_fin,
      rapport,
      statut,
      localisation,
      demande_intervention_id,
      pv_intervention_id,
      created_at,
      updated_at
    `)
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  
  if (!data) return null;
  
  const { data: demandeData, error: demandeError } = await supabase
    .from('demande_interventions')
    .select(`
      id,
      description,
      date_demande,
      urgence,
      statut,
      client_id,
      client:client_id (
        id, 
        nom_entreprise,
        email,
        tel
      )
    `)
    .eq('id', data.demande_intervention_id)
    .maybeSingle();
  
  if (demandeError) throw demandeError;
  
  const { data: teamsData, error: teamsError } = await supabase
    .from('intervention_equipes')
    .select(`
      equipe_id,
      equipes:equipe_id (
        id,
        nom,
        specialisation
      )
    `)
    .eq('intervention_id', id);
  
  if (teamsError) throw teamsError;
  
  const teams = teamsData.map(item => item.equipes);
  
  const { data: equipmentData, error: equipmentError } = await supabase
    .from('intervention_materiels')
    .select(`
      materiel_id,
      materiels:materiel_id (
        id,
        reference,
        type_materiel,
        etat
      )
    `)
    .eq('intervention_id', id);
  
  if (equipmentError) throw equipmentError;
  
  const equipment = equipmentData.map(item => item.materiels);
  
  let pv = null;
  if (data.pv_intervention_id) {
    const { data: pvData, error: pvError } = await supabase
      .from('pv_interventions')
      .select(`
        id,
        validation_client,
        date_validation,
        commentaire
      `)
      .eq('id', data.pv_intervention_id)
      .maybeSingle();
    
    if (!pvError && pvData) {
      pv = pvData;
    }
  }
  
  return {
    ...data,
    demande: demandeData || null,
    teams,
    equipment,
    pv_interventions: pv
  };
};

const updateStatus = async (id: string, status: string) => {
  const updates = { 
    statut: status,
    ...(status === "en_cours" && { date_debut: new Date().toISOString() }),
    ...(status === "terminée" && { date_fin: new Date().toISOString() }),
  };
  
  const { data, error } = await supabase
    .from('interventions')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data;
};

const assignTeam = async (interventionId: string, teamId: string) => {
  try {
    await supabase
      .from('intervention_equipes')
      .delete()
      .eq('intervention_id', interventionId);
    
    const { error } = await supabase
      .from('intervention_equipes')
      .insert({
        intervention_id: interventionId,
        equipe_id: teamId
      });
    
    if (error) throw error;
    
    const { data: interventionData } = await supabase
      .from('interventions')
      .select('statut')
      .eq('id', interventionId)
      .maybeSingle();
    
    if (interventionData && (interventionData.statut === 'en_attente' || interventionData.statut === 'validée')) {
      await supabase
        .from('interventions')
        .update({ statut: 'planifiée' })
        .eq('id', interventionId);
    }
    
    return true;
  } catch (error) {
    throw error;
  }
};

const assignEquipment = async (interventionId: string, equipmentIds: string[]) => {
  try {
    await supabase
      .from('intervention_materiels')
      .delete()
      .eq('intervention_id', interventionId);
    
    const insertData = equipmentIds.map(equipId => ({
      intervention_id: interventionId,
      materiel_id: equipId
    }));
    
    const { error } = await supabase
      .from('intervention_materiels')
      .insert(insertData);
    
    if (error) throw error;
    
    for (const equipId of equipmentIds) {
      await supabase
        .from('materiels')
        .update({ etat: 'en utilisation' })
        .eq('id', equipId);
    }
    
    const { data: interventionData } = await supabase
      .from('interventions')
      .select('statut')
      .eq('id', interventionId)
      .maybeSingle();
    
    if (interventionData && (interventionData.statut === 'en_attente' || interventionData.statut === 'validée')) {
      await supabase
        .from('interventions')
        .update({ statut: 'planifiée' })
        .eq('id', interventionId);
    }
    
    return true;
  } catch (error) {
    throw error;
  }
};

const getAvailableEquipment = async () => {
  try {
    const { data, error } = await supabase
      .from('materiels')
      .select('*')
      .in('etat', ['disponible']);
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    throw error;
  }
};

const getAvailableTeams = async () => {
  try {
    const { data, error } = await supabase
      .from('equipes')
      .select('*');
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    throw error;
  }
};

const getDetailedInterventions = async (options = {}) => {
  return [];
};

const getByStatus = async (status) => {
  return [];
};

export const interventionService = {
  getAll,
  getById,
  updateStatus,
  assignTeam,
  assignEquipment,
  getAvailableEquipment,
  getAvailableTeams,
  getDetailedInterventions,
  getByStatus,
};
