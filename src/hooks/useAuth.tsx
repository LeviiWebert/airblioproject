
import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkUserType } from "@/utils/userTypeChecker";
import { createClientProfile, createAdminProfile } from "@/utils/authUtils";
import { AuthContext } from "@/contexts/AuthProvider";

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  const { session, user, userType, loading, initialized, clientId } = context;
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);

  // Add an effect to handle loading timeouts
  useEffect(() => {
    if (loading && !initialized) {
      console.log("Setup loading timeout in useAuth hook");
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.error("Auth loading timeout reached in useAuth hook");
        toast.error("Le chargement des données d'authentification a pris trop de temps. Veuillez rafraîchir la page.");
      }, 5000); // Reduced from 8s to 5s for faster feedback
      
      return () => clearTimeout(timeoutId);
    }
  }, [loading, initialized]);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    try {
      setAuthError(null);
      console.log("Attempting to sign in:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      console.log("Sign in successful for:", email);
      const user = data.session.user;
      
      // Determine user type after login
      const type = await checkUserType(user.id);
      console.log("User type after login:", type);
      
      return type;
    } catch (error: any) {
      console.error("Error signing in:", error.message);
      setAuthError(error.message);
      toast.error(`Erreur de connexion: ${error.message}`);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userType: "admin" | "client"): Promise<string | null> => {
    try {
      setAuthError(null);
      // Set metadata for user type
      const metadata = { user_type: userType };
      
      // Create the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: window.location.origin + '/auth',
        }
      });
      
      if (error) {
        throw error;
      }
      
      // If Supabase is configured to not require email confirmation, the user will be signed in immediately
      if (data.session) {
        const userId = data.user.id;
        
        // Create the appropriate profile
        if (userType === "admin") {
          await createAdminProfile(userId, email);
          return "admin";
        } else {
          await createClientProfile(userId, email);
          return "client";
        }
      }
      
      toast.success("Inscription réussie! Vérifiez votre email pour confirmer votre compte.");
      return null;
    } catch (error: any) {
      console.error("Error signing up:", error.message);
      setAuthError(error.message);
      toast.error(`Erreur d'inscription: ${error.message}`);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setAuthError(null);
      await supabase.auth.signOut();
      toast.success("Vous avez été déconnecté");
      navigate('/auth', { replace: true });
    } catch (error: any) {
      console.error("Error signing out:", error.message);
      setAuthError(error.message);
      toast.error(`Erreur de déconnexion: ${error.message}`);
    }
  };

  return {
    session,
    user,
    userType,
    loading,
    initialized,
    clientId,
    authError,
    signIn,
    signUp,
    signOut
  };
};

export default useAuth;
