
import { supabase } from '@/integrations/supabase/client';

// Function to get dashboard statistics
const getStats = async () => {
  // Get count of clients
  const { count: clientCount, error: clientError } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true });
  
  // Get count of interventions
  const { count: interventionCount, error: interventionError } = await supabase
    .from('interventions')
    .select('*', { count: 'exact', head: true });
  
  // Get count of equipment
  const { count: equipmentCount, error: equipmentError } = await supabase
    .from('materiels')
    .select('*', { count: 'exact', head: true });
  
  // Get count of teams
  const { count: teamCount, error: teamError } = await supabase
    .from('equipes')
    .select('*', { count: 'exact', head: true });
  
  if (clientError || interventionError || equipmentError || teamError) {
    throw new Error('Error fetching dashboard statistics');
  }
  
  return {
    clientCount: clientCount || 0,
    interventionCount: interventionCount || 0,
    equipmentCount: equipmentCount || 0,
    teamCount: teamCount || 0
  };
};

// Export the service functions
export const dashboardService = {
  getStats
};
