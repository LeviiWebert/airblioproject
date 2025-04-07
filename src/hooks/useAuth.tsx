
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { checkUserType } from "@/utils/userTypeChecker";
import { createClientProfile, createAdminProfile } from "@/utils/authUtils";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Changement d'état d'authentification:", event);
      
      if (!mounted) return;
      
      if (newSession?.user?.id) {
        setSession(newSession);
        
        setTimeout(async () => {
          if (!mounted) return;
          
          const type = await checkUserType(newSession.user.id);
          console.log("Type d'utilisateur détecté:", type);
          setUserType(type);
          setLoading(false);
        }, 0);
      } else {
        setSession(null);
        setUserType(null);
        setLoading(false);
      }
    });

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(session);
        
        if (session?.user?.id) {
          const type = await checkUserType(session.user.id);
          console.log("Type d'utilisateur détecté à l'initialisation:", type);
          setUserType(type);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de la session:", error);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };
    
    initSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, userType: "admin" | "client") => {
    try {
      setLoading(true);
      console.log(`Tentative d'inscription en tant que ${userType} pour: ${email}`);
      
      // Désactiver la confirmation par email pour faciliter les tests
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType
          },
          // On ne définit pas emailRedirectTo pour ne pas déclencher la confirmation par email
        }
      });

      if (error) {
        console.error("Erreur d'inscription:", error);
        if (error.message.includes('already registered')) {
          throw new Error("Cet email est déjà utilisé. Essayez de vous connecter.");
        } else if (error.message.includes('stronger password')) {
          throw new Error("Votre mot de passe est trop faible. Utilisez au moins 6 caractères avec des lettres et des chiffres.");
        } else {
          throw error;
        }
      }

      if (data.user) {
        if (userType === "client") {
          await createClientProfile(data.user.id, email);
        } else if (userType === "admin") {
          await createAdminProfile(data.user.id, email);
        }
      }

      if (data.session) {
        setSession(data.session);
        
        const type = await checkUserType(data.user!.id);
        setUserType(type);
        
        toast.success("Inscription réussie! Vous êtes maintenant connecté.");
        
        if (type === "admin") {
          navigate("/admin", { replace: true });
        } else if (type === "client") {
          navigate("/client-dashboard", { replace: true });
        }
        
        return type;
      } else {
        // Si l'authentification n'a pas créé de session immédiate (cas rare avec emailRedirectTo désactivé)
        toast.success("Inscription réussie! Essayez de vous connecter.");
        return null;
      }
    } catch (error: any) {
      console.error("Erreur d'inscription:", error);
      toast.error(error.message || "Erreur lors de l'inscription");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log(`Tentative de connexion pour: ${email}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes('Invalid login')) {
          throw new Error("Email ou mot de passe incorrect");
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error("Email non confirmé. Veuillez vérifier votre boîte mail");
        } else {
          throw error;
        }
      }

      if (data.session) {
        const userId = data.session.user.id;
        console.log(`Connexion réussie. Vérification du type pour l'utilisateur ${userId}`);
        
        const type = await checkUserType(userId);
        console.log(`Type d'utilisateur détecté: ${type}`);
        
        if (!type) {
          await supabase.auth.signOut();
          throw new Error("Votre compte n'est associé à aucun profil. Veuillez contacter l'administrateur.");
        }
        
        toast.success("Connexion réussie");
        
        if (type === "admin") {
          navigate("/admin", { replace: true });
        } else if (type === "client") {
          navigate("/client-dashboard", { replace: true });
        }
        
        return type;
      }
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      toast.error(error.message || "Échec de la connexion");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      toast.success("Vous avez été déconnecté avec succès");
      navigate('/');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast.error("Erreur lors de la déconnexion");
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    userType,
    loading,
    initialized,
    signIn,
    signUp,
    signOut
  };
}
