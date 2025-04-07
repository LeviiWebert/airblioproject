
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
      }, 5000); // 5 second timeout
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
      
      const userMetadata = user.user_metadata;
      console.log("Metadata utilisateur:", userMetadata);
      
      // Check if admin by email convention or metadata
      if (isAdminUser(userEmail, userMetadata)) {
        console.log("Utilisateur identifié comme administrateur");
        
        const { data: existingAdmin, error: checkError } = await supabase
          .from('utilisateurs')
          .select('id, role')
          .eq('email', userEmail)
          .maybeSingle();
          
        if (!existingAdmin && !checkError) {
          const { error: createError } = await supabase
            .from('utilisateurs')
            .insert([
              { 
                id: userId, 
                email: userEmail, 
                nom: userEmail?.split('@')[0] || 'Admin', 
                role: 'admin' 
              }
            ]);
            
          if (createError) {
            console.error("Échec de l'auto-création du profil admin:", createError);
          } else {
            console.log("Profil admin auto-créé avec succès");
            return "admin";
          }
        }
        
        if (existingAdmin) {
          console.log("Profil admin existant trouvé:", existingAdmin);
          return "admin";
        }
      }
      
      // Check if client by metadata
      if (userMetadata?.user_type === 'client') {
        console.log("Utilisateur identifié comme client via metadata");
        
        const { data: existingClientProfile, error: checkClientProfileError } = await supabase
          .from('clients')
          .select('id')
          .eq('email', userEmail)
          .maybeSingle();
          
        if (!existingClientProfile && !checkClientProfileError) {
          const { error: createClientProfileError } = await supabase
            .from('clients')
            .insert([
              { 
                id: userId, 
                email: userEmail, 
                nom_entreprise: userEmail?.split('@')[0] || 'Client'
              }
            ]);
            
          if (createClientProfileError) {
            console.error("Échec de l'auto-création du profil client depuis metadata:", createClientProfileError);
          } else {
            console.log("Profil client auto-créé depuis metadata avec succès");
          }
        }
        
        return "client";
      }
      
      // Check in admin table
      const { data: adminData, error: adminError } = await supabase
        .from('utilisateurs')
        .select('role, email')
        .eq('email', userEmail)
        .eq('role', 'admin')
        .maybeSingle();

      if (adminError) {
        console.error("Erreur lors de la vérification du rôle admin:", adminError);
      }

      if (adminData) {
        console.log("Utilisateur identifié comme admin via email:", adminData);
        return "admin";
      }
      
      // Check in client table
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, email')
        .eq('email', userEmail)
        .maybeSingle();

      if (clientError) {
        console.error("Erreur lors de la vérification du rôle client:", clientError);
      }

      if (clientData) {
        console.log("Utilisateur identifié comme client via email:", clientData);
        return "client";
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
