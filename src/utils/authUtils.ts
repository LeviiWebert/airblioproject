
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Utility function to check if user is an admin based on email or metadata
 */
export const isAdminUser = (userEmail: string | undefined, userMetadata: any): boolean => {
  if (!userEmail) return false;
  
  // Check by email convention
  if (userEmail === "leviwebert147@gmail.com" || userEmail.includes("admin")) {
    return true;
  }
  
  // Check by metadata
  if (userMetadata?.user_type === 'admin') {
    return true;
  }
  
  return false;
};

/**
 * Create client profile in database
 */
export const createClientProfile = async (userId: string, email: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('clients')
      .insert([{ 
        id: userId, 
        email: email, 
        nom_entreprise: email.split('@')[0] || 'Client' 
      }]);
      
    if (error) {
      console.error("Erreur lors de la création du profil client:", error);
      console.error("Détails de l'erreur:", error.details, error.hint, error.message);
      toast.error("Erreur lors de la création du profil client. Contactez l'administrateur.");
      return false;
    }
    
    console.log("Profil client créé avec succès");
    return true;
  } catch (error) {
    console.error("Exception lors de la création du profil client:", error);
    toast.error("Exception lors de la création du profil client. Contactez l'administrateur.");
    return false;
  }
};

/**
 * Create admin profile in database
 */
export const createAdminProfile = async (userId: string, email: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('utilisateurs')
      .insert([{ 
        id: userId, 
        email: email, 
        nom: email.split('@')[0] || 'Admin', 
        role: 'admin' 
      }]);
      
    if (error) {
      console.error("Erreur lors de la création du profil admin:", error);
      console.error("Détails de l'erreur:", error.details, error.hint, error.message);
      toast.error("Profil administrateur partiellement créé. Veuillez contacter l'administrateur.");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception lors de la création du profil admin:", error);
    toast.error("Exception lors de la création du profil admin. Contactez l'administrateur.");
    return false;
  }
};
