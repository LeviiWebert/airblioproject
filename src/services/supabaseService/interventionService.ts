
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
  
  // Transformer les données pour correspondre au format attendu
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
  
  // Récupérer la demande associée
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
  
  // Récupérer les équipes assignées
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
  
  // Récupérer le matériel assigné
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
  
  // Récupérer le PV d'intervention s'il existe
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

export const interventionService = {
  getAll,
  getById,
  updateStatus,
};
