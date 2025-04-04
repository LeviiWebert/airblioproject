
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Facturation = Database["public"]["Tables"]["facturations"]["Row"];
type FacturationInsert = Database["public"]["Tables"]["facturations"]["Insert"];
type DetailsFacturation = Database["public"]["Tables"]["details_facturation"]["Row"];
type DetailsFacturationInsert = Database["public"]["Tables"]["details_facturation"]["Insert"];

export interface FacturationWithDetails extends Facturation {
  details?: DetailsFacturation[];
  client?: {
    nom_entreprise: string;
  };
  intervention?: {
    id: string;
    localisation: string;
    demande_intervention_id: string;
  };
}

export interface FacturationFormData {
  date_facturation: Date;
  montant_total: number;
  statut_paiement: "en_attente" | "payée" | "annulée";
  intervention_id: string;
  details: {
    description: string;
    heures_travaillees: number;
    taux_horaire: number;
  }[];
}

// Récupérer toutes les facturations avec leurs détails
export const getFacturations = async (): Promise<FacturationWithDetails[]> => {
  const { data, error } = await supabase
    .from('facturations')
    .select(`
      *,
      intervention:intervention_id (
        id,
        demande_intervention_id,
        localisation
      )
    `);
  
  if (error) throw error;
  
  // Si on a des facturations, on récupère les clients associés via les demandes d'intervention
  if (data && data.length > 0) {
    const interventionIds = data
      .filter(item => item.intervention?.demande_intervention_id)
      .map(item => item.intervention.demande_intervention_id);
    
    if (interventionIds.length > 0) {
      const { data: demandesData, error: demandesError } = await supabase
        .from('demande_interventions')
        .select(`
          id,
          client_id,
          client:client_id (nom_entreprise)
        `)
        .in('id', interventionIds);
      
      if (demandesError) throw demandesError;
      
      // On récupère aussi les détails de facturation
      const { data: detailsData, error: detailsError } = await supabase
        .from('details_facturation')
        .select('*')
        .in('facturation_id', data.map(item => item.id));
      
      if (detailsError) throw detailsError;
      
      // On ajoute les informations du client à chaque facture
      const enrichedData = data.map(invoice => {
        // Ajout des infos client
        let enrichedInvoice: FacturationWithDetails = { ...invoice };
        
        if (invoice.intervention?.demande_intervention_id) {
          const matchingDemande = demandesData?.find(
            demande => demande.id === invoice.intervention.demande_intervention_id
          );
          enrichedInvoice.client = matchingDemande?.client;
        }
        
        // Ajout des détails de facturation
        enrichedInvoice.details = detailsData?.filter(
          detail => detail.facturation_id === invoice.id
        ) || [];
        
        return enrichedInvoice;
      });
      
      return enrichedData;
    }
  }
  
  return data as FacturationWithDetails[];
};

// Récupérer une facturation par son ID
export const getFacturationById = async (id: string): Promise<FacturationWithDetails | null> => {
  const { data, error } = await supabase
    .from('facturations')
    .select(`
      *,
      intervention:intervention_id (
        id,
        demande_intervention_id,
        localisation
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Aucune facturation trouvée
    }
    throw error;
  }
  
  // Récupérer les détails de facturation
  const { data: detailsData, error: detailsError } = await supabase
    .from('details_facturation')
    .select('*')
    .eq('facturation_id', id);
  
  if (detailsError) throw detailsError;
  
  // Si on a une facturation, on récupère le client associé via la demande d'intervention
  if (data && data.intervention?.demande_intervention_id) {
    const { data: demandeData, error: demandeError } = await supabase
      .from('demande_interventions')
      .select(`
        client:client_id (nom_entreprise)
      `)
      .eq('id', data.intervention.demande_intervention_id)
      .single();
    
    if (demandeError && demandeError.code !== 'PGRST116') throw demandeError;
    
    return {
      ...data,
      details: detailsData || [],
      client: demandeData?.client
    };
  }
  
  return {
    ...data,
    details: detailsData || []
  };
};

// Créer une nouvelle facturation avec ses détails
export const createFacturation = async (formData: FacturationFormData): Promise<string> => {
  // Transaction pour créer la facturation et ses détails
  const { data: facturation, error } = await supabase
    .from('facturations')
    .insert({
      date_facturation: formData.date_facturation.toISOString(),
      montant_total: formData.montant_total,
      statut_paiement: formData.statut_paiement,
      intervention_id: formData.intervention_id
    })
    .select('id')
    .single();
  
  if (error) throw error;
  
  if (formData.details && formData.details.length > 0) {
    const detailsToInsert = formData.details.map(detail => ({
      facturation_id: facturation.id,
      description: detail.description,
      heures_travaillees: detail.heures_travaillees,
      taux_horaire: detail.taux_horaire
    }));
    
    const { error: detailsError } = await supabase
      .from('details_facturation')
      .insert(detailsToInsert);
    
    if (detailsError) throw detailsError;
  }
  
  return facturation.id;
};

// Mettre à jour une facturation existante
export const updateFacturation = async (id: string, formData: FacturationFormData): Promise<void> => {
  // Mettre à jour la facturation
  const { error } = await supabase
    .from('facturations')
    .update({
      date_facturation: formData.date_facturation.toISOString(),
      montant_total: formData.montant_total,
      statut_paiement: formData.statut_paiement,
      intervention_id: formData.intervention_id
    })
    .eq('id', id);
  
  if (error) throw error;
  
  // Supprimer les anciens détails
  const { error: deleteError } = await supabase
    .from('details_facturation')
    .delete()
    .eq('facturation_id', id);
  
  if (deleteError) throw deleteError;
  
  // Ajouter les nouveaux détails
  if (formData.details && formData.details.length > 0) {
    const detailsToInsert = formData.details.map(detail => ({
      facturation_id: id,
      description: detail.description,
      heures_travaillees: detail.heures_travaillees,
      taux_horaire: detail.taux_horaire
    }));
    
    const { error: insertError } = await supabase
      .from('details_facturation')
      .insert(detailsToInsert);
    
    if (insertError) throw insertError;
  }
};

// Supprimer une facturation
export const deleteFacturation = async (id: string): Promise<void> => {
  // Supprimer d'abord les détails de facturation (contrainte de clé étrangère)
  const { error: detailsError } = await supabase
    .from('details_facturation')
    .delete()
    .eq('facturation_id', id);
  
  if (detailsError) throw detailsError;
  
  // Puis supprimer la facturation
  const { error } = await supabase
    .from('facturations')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Récupérer la liste des interventions pour la sélection
export const getInterventionsForSelection = async (): Promise<{ id: string; label: string }[]> => {
  const { data, error } = await supabase
    .from('interventions')
    .select(`
      id,
      localisation,
      demande_intervention_id,
      demande:demande_intervention_id (
        client:client_id (nom_entreprise)
      )
    `)
    .is('facturation_id', null) // Uniquement les interventions sans facturation
    .eq('statut', 'terminée'); // Uniquement les interventions terminées
  
  if (error) throw error;
  
  return (data || []).map(intervention => ({
    id: intervention.id,
    label: `${intervention.demande?.client?.nom_entreprise || 'Client inconnu'} - ${intervention.localisation}`
  }));
};
