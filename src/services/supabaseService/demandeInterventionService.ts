
import { supabase } from '@/integrations/supabase/client';

// Function to get all intervention requests
const getAll = async () => {
  const { data, error } = await supabase
    .from('demande_interventions')
    .select('*');
  
  if (error) throw error;
  return data;
};

// Function to get all pending intervention requests
const getPending = async () => {
  const { data, error } = await supabase
    .from('demande_interventions')
    .select(`
      *,
      client:client_id (
        id,
        nom_entreprise,
        email,
        tel
      )
    `)
    .eq('statut', 'en_attente');
  
  if (error) throw error;
  return data;
};

// Function to get an intervention request by ID
const getById = async (id: string) => {
  const { data, error } = await supabase
    .from('demande_interventions')
    .select(`
      *,
      client:client_id (
        id,
        nom_entreprise,
        email,
        tel
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

// Function to create a new intervention request
const create = async (demandeData: any) => {
  // Remove any fields not in the demande_interventions table
  const { localisation, ...validData } = demandeData;
  
  console.log("Sanitized data for demande_interventions:", validData);
  
  const { data, error } = await supabase
    .from('demande_interventions')
    .insert([validData])
    .select();
  
  if (error) throw error;
  return data[0];
};

// Function to update the status of an intervention request
const updateStatus = async (id: string, status: string) => {
  console.log(`Updating status for demande ${id} to ${status}`);
  
  const { data, error } = await supabase
    .from('demande_interventions')
    .update({ statut: status })
    .eq('id', id)
    .select();
  
  if (error) {
    console.error("Erreur lors de la mise à jour du statut de la demande:", error);
    throw error;
  }
  console.log("Statut de la demande mis à jour avec succès:", data);
  return data[0];
};

// Fonction pour créer une intervention à partir d'une demande puis supprimer la demande
const createFromRequestAndDelete = async (demandeId: string) => {
  console.log("=== DÉBUT: createFromRequestAndDelete ===");
  console.log(`Création d'intervention à partir de la demande ID: ${demandeId}`);
  
  try {
    // 1. Récupérer la demande pour obtenir les infos du client (pour l'affichage)
    const { data: demande, error: demandeError } = await supabase
      .from('demande_interventions')
      .select(`
        *,
        client:client_id (
          id,
          nom_entreprise
        )
      `)
      .eq('id', demandeId)
      .single();
    
    if (demandeError) {
      console.error("❌ ERREUR: Impossible de récupérer la demande:", demandeError);
      throw demandeError;
    }
    
    console.log("✅ Demande trouvée:", {
      id: demande.id, 
      description: demande.description,
      client: demande.client?.nom_entreprise
    });
    
    // 2. Créer une intervention basique avec seulement les données essentielles
    const interventionData = {
      demande_intervention_id: demandeId,
      statut: 'planifiée',
      localisation: 'À définir'
    };
    
    console.log("📝 Création de l'intervention avec ces données:", interventionData);
    
    // Créer l'intervention dans la base de données
    const { data: intervention, error: interventionError } = await supabase
      .from('interventions')
      .insert([interventionData])
      .select();
    
    if (interventionError) {
      console.error("❌ ERREUR: Impossible de créer l'intervention:", interventionError);
      throw interventionError;
    }
    
    console.log("✅ Intervention créée avec succès:", intervention[0]);
    
    // 3. Supprimer la demande d'intervention d'origine
    console.log(`📝 Suppression de la demande ID: ${demandeId}`);
    
    const { error: deleteError } = await supabase
      .from('demande_interventions')
      .delete()
      .eq('id', demandeId);
    
    if (deleteError) {
      console.error("❌ ERREUR: Impossible de supprimer la demande:", deleteError);
      console.error("L'intervention a été créée mais la demande n'a pas pu être supprimée");
      throw deleteError;
    }
    
    console.log("✅ Demande supprimée avec succès");
    console.log("=== FIN: createFromRequestAndDelete ===");
    
    return intervention[0];
  } catch (error) {
    console.error("❌ ERREUR GLOBALE dans createFromRequestAndDelete:", error);
    throw error;
  }
};

export const demandeInterventionService = {
  getAll,
  getPending,
  getById,
  create,
  updateStatus,
  createFromRequestAndDelete
};
