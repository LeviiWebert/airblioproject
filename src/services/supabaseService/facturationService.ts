
import { supabase } from '@/integrations/supabase/client';

// Interface definitions
export interface FacturationFormData {
  date_facturation: Date;
  intervention_id: string;
  statut_paiement: "en_attente" | "payée" | "annulée";
  details: {
    description: string;
    heures_travaillees: number;
    taux_horaire: number;
  }[];
  montant_total?: number;
}

export interface FacturationWithDetails {
  id: string;
  date_facturation: string;
  montant_total: number;
  statut_paiement: "en_attente" | "payée" | "annulée";
  intervention_id: string;
  intervention?: {
    id: string;
    localisation: string;
  };
  client?: {
    id: string;
    nom_entreprise: string;
  };
  details?: {
    id: string;
    description: string;
    heures_travaillees: number;
    taux_horaire: number;
  }[];
}

// Function to get all invoices with details
export const getFacturations = async (): Promise<FacturationWithDetails[]> => {
  const { data, error } = await supabase
    .from('facturations')
    .select(`
      *,
      intervention:intervention_id (
        id,
        localisation,
        demande_intervention_id
      ),
      details:details_facturation (
        id,
        description,
        heures_travaillees,
        taux_horaire
      )
    `);
  
  if (error) throw error;

  // Get clients for each invoice
  const invoicesWithClients = await Promise.all(
    (data || []).map(async (facturation) => {
      if (facturation.intervention?.demande_intervention_id) {
        const { data: demandeData } = await supabase
          .from('demande_interventions')
          .select('client_id')
          .eq('id', facturation.intervention.demande_intervention_id)
          .single();

        if (demandeData?.client_id) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('id, nom_entreprise')
            .eq('id', demandeData.client_id)
            .single();

          return {
            ...facturation,
            client: clientData,
            // Ensuring statut_paiement is one of the allowed values
            statut_paiement: (facturation.statut_paiement as "en_attente" | "payée" | "annulée") || "en_attente"
          };
        }
      }
      return {
        ...facturation,
        // Ensuring statut_paiement is one of the allowed values
        statut_paiement: (facturation.statut_paiement as "en_attente" | "payée" | "annulée") || "en_attente"
      };
    })
  );

  return invoicesWithClients as FacturationWithDetails[];
};

// Function to get an invoice by ID
export const getById = async (id: string): Promise<FacturationWithDetails> => {
  const { data, error } = await supabase
    .from('facturations')
    .select(`
      *,
      intervention:intervention_id (
        id,
        localisation,
        demande_intervention_id
      ),
      details:details_facturation (
        id,
        description,
        heures_travaillees,
        taux_horaire
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;

  // Get client info
  if (data.intervention?.demande_intervention_id) {
    const { data: demandeData } = await supabase
      .from('demande_interventions')
      .select('client_id')
      .eq('id', data.intervention.demande_intervention_id)
      .single();

    if (demandeData?.client_id) {
      const { data: clientData } = await supabase
        .from('clients')
        .select('id, nom_entreprise')
        .eq('id', demandeData.client_id)
        .single();

      return {
        ...data,
        client: clientData,
        // Ensuring statut_paiement is one of the allowed values
        statut_paiement: (data.statut_paiement as "en_attente" | "payée" | "annulée") || "en_attente"
      };
    }
  }

  return {
    ...data,
    // Ensuring statut_paiement is one of the allowed values
    statut_paiement: (data.statut_paiement as "en_attente" | "payée" | "annulée") || "en_attente"
  } as FacturationWithDetails;
};

// Function to create an invoice
export const createFacturation = async (formData: FacturationFormData): Promise<string> => {
  // Convert Date to ISO string for Supabase
  const dateFacturation = formData.date_facturation.toISOString();
  
  // 1. Insert the main facturation record
  const { data: facturationData, error: facturationError } = await supabase
    .from('facturations')
    .insert({
      date_facturation: dateFacturation,
      montant_total: formData.montant_total || 0,
      intervention_id: formData.intervention_id,
      statut_paiement: formData.statut_paiement
    })
    .select()
    .single();
  
  if (facturationError) throw facturationError;

  // 2. Insert details
  const detailsData = formData.details.map(detail => ({
    description: detail.description,
    heures_travaillees: detail.heures_travaillees,
    taux_horaire: detail.taux_horaire,
    facturation_id: facturationData.id
  }));

  const { error: detailsError } = await supabase
    .from('details_facturation')
    .insert(detailsData);
  
  if (detailsError) throw detailsError;

  // 3. Update the intervention record with the facturation_id
  const { error: interventionError } = await supabase
    .from('interventions')
    .update({ facturation_id: facturationData.id })
    .eq('id', formData.intervention_id);
  
  if (interventionError) throw interventionError;

  return facturationData.id;
};

// Function to update an invoice
export const updateFacturation = async (id: string, formData: FacturationFormData): Promise<void> => {
  // Convert Date to ISO string for Supabase
  const dateFacturation = formData.date_facturation.toISOString();
  
  // 1. Update the main facturation record
  const { error: facturationError } = await supabase
    .from('facturations')
    .update({
      date_facturation: dateFacturation,
      montant_total: formData.montant_total || 0,
      statut_paiement: formData.statut_paiement
    })
    .eq('id', id);
  
  if (facturationError) throw facturationError;

  // 2. Delete existing details
  const { error: deleteError } = await supabase
    .from('details_facturation')
    .delete()
    .eq('facturation_id', id);
  
  if (deleteError) throw deleteError;

  // 3. Insert new details
  const detailsData = formData.details.map(detail => ({
    description: detail.description,
    heures_travaillees: detail.heures_travaillees,
    taux_horaire: detail.taux_horaire,
    facturation_id: id
  }));

  const { error: detailsError } = await supabase
    .from('details_facturation')
    .insert(detailsData);
  
  if (detailsError) throw detailsError;
};

// Function to delete an invoice
export const deleteFacturation = async (id: string): Promise<void> => {
  // 1. First, delete all associated details
  const { error: detailsError } = await supabase
    .from('details_facturation')
    .delete()
    .eq('facturation_id', id);
  
  if (detailsError) throw detailsError;

  // 2. Update any intervention that references this facturation
  const { error: interventionError } = await supabase
    .from('interventions')
    .update({ facturation_id: null })
    .eq('facturation_id', id);
  
  if (interventionError) throw interventionError;

  // 3. Delete the facturation
  const { error: facturationError } = await supabase
    .from('facturations')
    .delete()
    .eq('id', id);
  
  if (facturationError) throw facturationError;
};

// Function to get interventions for selection
export const getInterventionsForSelection = async (): Promise<Array<{ id: string; label: string }>> => {
  // Get all completed interventions that don't have a facturation yet
  const { data, error } = await supabase
    .from('interventions')
    .select(`
      id,
      localisation,
      statut,
      facturation_id,
      demande_intervention_id
    `)
    .eq('statut', 'terminée')
    .is('facturation_id', null);
  
  if (error) throw error;

  // For each intervention, get the client name
  const interventionsWithClientNames = await Promise.all(
    (data || []).map(async (intervention) => {
      if (intervention.demande_intervention_id) {
        const { data: demandeData } = await supabase
          .from('demande_interventions')
          .select('client_id')
          .eq('id', intervention.demande_intervention_id)
          .single();

        if (demandeData?.client_id) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('nom_entreprise')
            .eq('id', demandeData.client_id)
            .single();

          return {
            id: intervention.id,
            label: `${clientData?.nom_entreprise || 'Client inconnu'} - ${intervention.localisation}`
          };
        }
      }
      return {
        id: intervention.id,
        label: `Client inconnu - ${intervention.localisation}`
      };
    })
  );

  return interventionsWithClientNames;
};

// Export the service functions
export const facturationService = {
  getFacturations,
  getById,
  createFacturation,
  updateFacturation,
  deleteFacturation,
  getInterventionsForSelection
};
