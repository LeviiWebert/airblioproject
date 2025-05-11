
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
  console.log("🔍 Récupération des demandes en attente...");
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
    .order('created_at', { ascending: false })
    .eq('statut', 'en_attente');
  
  if (error) {
    console.error("❌ Erreur lors de la récupération des demandes en attente:", error);
    throw error;
  }
  
  console.log(`✅ ${data?.length || 0} demandes en attente récupérées`);
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
  console.log("Création d'une nouvelle demande d'intervention avec les données:", demandeData);
  
  const { data, error } = await supabase
    .from('demande_interventions')
    .insert([demandeData])
    .select();
  
  if (error) throw error;
  return data[0];
};

// Function to update the status of an intervention request
const updateStatus = async (id: string, status: string, comment?: string) => {
  console.log(`Updating status for demande ${id} to ${status}`);
  console.log(`Comment provided: ${comment || 'None'}`);
  
  const updateData: any = { statut: status };
  
  // Add comment to the motif_rejet field if provided (for rejection cases)
  if (comment && status === 'rejetée') {
    updateData.motif_rejet = comment;
    console.log("Adding rejection reason:", comment);
  }
  
  const { data, error } = await supabase
    .from('demande_interventions')
    .update(updateData)
    .eq('id', id)
    .select();
  
  if (error) {
    console.error("Erreur lors de la mise à jour du statut de la demande:", error);
    throw error;
  }
  console.log("Statut de la demande mis à jour avec succès:", data);
  return data[0];
};

// Fonction modifiée: au lieu de supprimer la demande, on la marque comme validée
// et on crée l'intervention
const createFromRequestAndAccept = async (demandeId: string) => {
  console.log("=== DÉBUT: createFromRequestAndAccept ===");
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
      client: demande.client?.nom_entreprise,
      date : demande.date_demande,
      localisation: demande.localisation
    });
    
    // 2. Créer une intervention basique avec seulement les données essentielles
    const interventionData = {
      demande_intervention_id: demandeId,
      statut: 'planifiée',
      date_debut: demande.date_demande,
      // Utiliser la localisation de la demande ou fournir une valeur par défaut
      localisation: demande.localisation || "À déterminer"
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
    
    // 3. Mettre à jour le statut de la demande d'intervention à "validée"
    console.log(`📝 Mise à jour du statut de la demande ID: ${demandeId} à "validée"`);
    
    const { data: updatedRequest, error: updateError } = await supabase
      .from('demande_interventions')
      .update({ 
        statut: 'validée',
        intervention_id: intervention[0].id  // Liaison avec l'intervention créée
      })
      .eq('id', demandeId)
      .select();
    
    if (updateError) {
      console.error("❌ ERREUR: Impossible de mettre à jour le statut de la demande:", updateError);
      throw updateError;
    }
    
    console.log("✅ Statut de la demande mis à jour avec succès:", updatedRequest);
    console.log("=== FIN: createFromRequestAndAccept ===");
    
    return intervention[0];
  } catch (error) {
    console.error("❌ ERREUR GLOBALE dans createFromRequestAndAccept:", error);
    throw error;
  }
};

export const demandeInterventionService = {
  getAll,
  getPending,
  getById,
  create,
  updateStatus,
  createFromRequestAndAccept
};
