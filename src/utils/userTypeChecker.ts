
import { supabase } from "@/integrations/supabase/client";
import { isAdminUser } from "./authUtils";

/**
 * Check the user type (admin or client) based on their ID
 */
export const checkUserType = async (userId: string): Promise<string | null> => {
  try {
    console.log("Vérification du type d'utilisateur:", userId);
    
    // Use a shorter timeout to prevent hanging
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.error("Timeout occurred in checkUserType");
        resolve(null);
      }, 800); // Reduced timeout for faster feedback
    });
    
    // Create the actual check function with prioritized metadata check
    const checkPromise = async (): Promise<string | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("Pas d'utilisateur trouvé");
        return null;
      }
      
      const userEmail = user.email;
      const userMetadata = user.user_metadata;
      
      console.log("Metadata utilisateur:", userMetadata);
      
      // PRIORITY 1: Check metadata first (fastest method)
      if (userMetadata?.user_type === 'client') {
        console.log("Utilisateur identifié comme client via metadata");
        return "client";
      }
      
      if (userMetadata?.user_type === 'admin' || isAdminUser(userEmail, userMetadata)) {
        console.log("Utilisateur identifié comme administrateur via metadata");
        return "admin";
      }
      
      // PRIORITY 2: Only continue to database checks if metadata doesn't resolve the type
      console.log(`Vérification de l'email ${userEmail} dans la base de données`);
      
      // Check in client table by email (most common case)
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, email')
        .eq('email', userEmail)
        .maybeSingle();

      if (!clientError && clientData) {
        console.log("Utilisateur identifié comme client via table clients:", clientData);
        return "client";
      }
      
      // Check in admin table by email
      const { data: adminData, error: adminError } = await supabase
        .from('utilisateurs')
        .select('role, email')
        .eq('email', userEmail)
        .eq('role', 'admin')
        .maybeSingle();

      if (!adminError && adminData) {
        console.log("Utilisateur identifié comme admin via table utilisateurs:", adminData);
        return "admin";
      }

      console.log("Utilisateur sans type défini");
      return null;
    };
    
    // Race the check against a timeout
    return Promise.race([checkPromise(), timeoutPromise]);
  } catch (error) {
    console.error("Erreur lors de la vérification du type d'utilisateur:", error);
    return null;
  }
};
