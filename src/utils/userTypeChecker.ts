
import { supabase } from "@/integrations/supabase/client";
import { isAdminUser } from "./authUtils";

/**
 * Check the user type (admin or client) based on their ID
 */
export const checkUserType = async (userId: string): Promise<string | null> => {
  try {
    console.log("Vérification du type d'utilisateur:", userId);
    
    // Use a timeout to prevent hanging
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.error("Timeout occurred in checkUserType");
        resolve(null);
      }, 3000); // Reduced to 3 second timeout for faster feedback
    });
    
    // Create the actual check function
    const checkPromise = async (): Promise<string | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("Pas d'utilisateur trouvé");
        return null;
      }
      
      const userEmail = user.email;
      console.log(`Vérification de l'email ${userEmail} pour la redirection`);
      
      // First check if this is a client based on metadata
      const userMetadata = user.user_metadata;
      if (userMetadata?.user_type === 'client') {
        console.log("Utilisateur identifié comme client via metadata");
        return "client";
      }
      
      // Next check if this is an admin based on metadata or email
      if (userMetadata?.user_type === 'admin' || isAdminUser(userEmail, userMetadata)) {
        console.log("Utilisateur identifié comme administrateur via metadata ou email");
        return "admin";
      }
      
      // Check in client table by email
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
