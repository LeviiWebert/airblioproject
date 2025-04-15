
import { supabase } from '@/integrations/supabase/client';
import { DashboardStats } from '@/types/models';
import { format } from 'date-fns';

// Function to get dashboard statistics
const getStats = async (): Promise<DashboardStats> => {
  // Get count of interventions by status
  const { data: interventionStatusData, error: interventionError } = await supabase
    .from('interventions')
    .select('statut');
  
  // Get count of teams
  const { data: equipesData, error: equipesError } = await supabase
    .from('equipes')
    .select('id');
  
  // Get count of equipment by status
  const { data: materielsData, error: materielsError } = await supabase
    .from('materiels')
    .select('etat');
  
  // Get count of invoices by status
  const { data: facturationData, error: facturationError } = await supabase
    .from('facturations')
    .select('statut_paiement');
  
  if (interventionError || equipesError || materielsError || facturationError) {
    throw new Error('Error fetching dashboard statistics');
  }
  
  // Calculate statistics from the fetched data
  const interventionStats = {
    totalInterventions: interventionStatusData?.length || 0,
    interventionsEnCours: interventionStatusData?.filter(i => i.statut === 'en_cours')?.length || 0,
    interventionsPlanifiees: interventionStatusData?.filter(i => i.statut === 'planifiée')?.length || 0,
    interventionsTerminees: interventionStatusData?.filter(i => i.statut === 'terminée')?.length || 0
  };
  
  const equipesStats = {
    equipesDisponibles: equipesData?.length || 0,
    equipesEnMission: 0
  };
  
  const materielsStats = {
    materielsDisponibles: materielsData?.filter(m => m.etat === 'disponible')?.length || 0,
    materielsEnUtilisation: materielsData?.filter(m => m.etat === 'en utilisation')?.length || 0
  };
  
  const facturationStats = {
    facturationEnAttente: facturationData?.filter(f => f.statut_paiement === 'en_attente')?.length || 0,
    facturationPayee: facturationData?.filter(f => f.statut_paiement === 'payée')?.length || 0
  };
  
  return {
    ...interventionStats,
    ...equipesStats,
    ...materielsStats,
    ...facturationStats
  };
};

// Function to get recent activity
const getRecentActivity = async (): Promise<any[]> => {
  // Get latest interventions
  const { data: interventionsData, error: interventionsError } = await supabase
    .from('interventions')
    .select(`
      id,
      statut,
      date_debut,
      date_fin,
      demande_intervention_id
    `)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (interventionsError) throw interventionsError;
  
  // For each intervention, get client info
  const activities = await Promise.all(
    (interventionsData || []).map(async (intervention) => {
      let activityType = '';
      let message = '';
      let date = new Date();
      
      if (intervention.statut === 'en_cours' && intervention.date_debut) {
        activityType = 'intervention_debut';
        message = 'Intervention démarrée';
        date = new Date(intervention.date_debut);
      } else if (intervention.statut === 'terminée' && intervention.date_fin) {
        activityType = 'intervention_fin';
        message = 'Intervention terminée';
        date = new Date(intervention.date_fin);
      }
      
      // Get client info
      let clientName = 'Client inconnu';
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
            
          if (clientData) {
            clientName = clientData.nom_entreprise;
          }
        }
      }
      
      return {
        id: intervention.id,
        type: activityType,
        date: date,
        message: message,
        client: clientName
      };
    })
  );
  
  // Get latest facturation activities
  const { data: facturationData, error: facturationError } = await supabase
    .from('facturations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);
    
  if (facturationError) throw facturationError;
  
  // Add facturation activities
  for (const facturation of (facturationData || [])) {
    // Get client info for this facturation
    let clientName = 'Client inconnu';
    
    if (facturation.intervention_id) {
      const { data: interventionData } = await supabase
        .from('interventions')
        .select('demande_intervention_id')
        .eq('id', facturation.intervention_id)
        .single();
        
      if (interventionData?.demande_intervention_id) {
        const { data: demandeData } = await supabase
          .from('demande_interventions')
          .select('client_id')
          .eq('id', interventionData.demande_intervention_id)
          .single();
          
        if (demandeData?.client_id) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('nom_entreprise')
            .eq('id', demandeData.client_id)
            .single();
            
          if (clientData) {
            clientName = clientData.nom_entreprise;
          }
        }
      }
    }
    
    activities.push({
      id: `fact-${facturation.id}`,
      type: 'facturation',
      date: new Date(facturation.date_facturation),
      message: `Facturation ${facturation.statut_paiement === 'payée' ? 'payée' : 'créée'} (${facturation.montant_total} €)`,
      client: clientName
    });
  }
  
  // Get latest demande activities
  const { data: demandeData, error: demandeError } = await supabase
    .from('demande_interventions')
    .select(`
      id,
      date_demande,
      client_id
    `)
    .order('date_demande', { ascending: false })
    .limit(3);
    
  if (demandeError) throw demandeError;
  
  // Add demande activities
  for (const demande of (demandeData || [])) {
    // Get client info
    let clientName = 'Client inconnu';
    
    if (demande.client_id) {
      const { data: clientData } = await supabase
        .from('clients')
        .select('nom_entreprise')
        .eq('id', demande.client_id)
        .single();
        
      if (clientData) {
        clientName = clientData.nom_entreprise;
      }
    }
    
    activities.push({
      id: `dem-${demande.id}`,
      type: 'demande',
      date: new Date(demande.date_demande),
      message: 'Nouvelle demande d\'intervention',
      client: clientName
    });
  }
  
  // Sort activities by date (newest first)
  return activities.sort((a, b) => b.date.getTime() - a.date.getTime());
};

// Export the service functions
export const dashboardService = {
  getStats,
  getRecentActivity
};
