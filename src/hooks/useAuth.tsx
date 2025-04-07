import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();
  
  const checkUserType = useCallback(async (userId: string) => {
    try {
      console.log("Vérification du type d'utilisateur:", userId);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("Pas d'utilisateur trouvé");
        return null;
      }
      
      const userEmail = user.email;
      console.log(`Vérification de l'email ${userEmail} pour la redirection`);
      
      const userMetadata = user.user_metadata;
      console.log("Metadata utilisateur:", userMetadata);
      
      if (userEmail === "leviwebert147@gmail.com" || userEmail?.includes("admin")) {
        console.log("Email identifié comme administrateur par convention");
        
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
                nom: userEmail.split('@')[0], 
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
      
      if (userMetadata?.user_type === 'admin') {
        console.log("Utilisateur identifié comme admin via metadata");
        
        const { data: existingAdminProfile, error: checkProfileError } = await supabase
          .from('utilisateurs')
          .select('id')
          .eq('email', userEmail)
          .maybeSingle();
          
        if (!existingAdminProfile && !checkProfileError) {
          const { error: createProfileError } = await supabase
            .from('utilisateurs')
            .insert([
              { 
                id: userId, 
                email: userEmail, 
                nom: userEmail.split('@')[0], 
                role: 'admin' 
              }
            ]);
            
          if (createProfileError) {
            console.error("Échec de l'auto-création du profil admin depuis metadata:", createProfileError);
          } else {
            console.log("Profil admin auto-créé depuis metadata avec succès");
          }
        }
        
        return "admin";
      } else if (userMetadata?.user_type === 'client') {
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
    } catch (error) {
      console.error("Erreur lors de la vérification du type d'utilisateur:", error);
      return null;
    }
  }, []);

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
  }, [checkUserType]);

  const signUp = async (email: string, password: string, userType: "admin" | "client") => {
    try {
      setLoading(true);
      console.log(`Tentative d'inscription en tant que ${userType} pour: ${email}`);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType
          },
          emailRedirectTo: window.location.origin + '/auth'
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
          const { error: clientError } = await supabase
            .from('clients')
            .insert([
              { id: data.user.id, email: email, nom_entreprise: email.split('@')[0] || 'Client' }
            ]);
          
          if (clientError) {
            console.error("Erreur lors de la création du profil client:", clientError);
            console.error("Détails de l'erreur:", clientError.details, clientError.hint, clientError.message);
            toast.error("Erreur lors de la création du profil client. Contactez l'administrateur.");
          } else {
            console.log("Profil client créé avec succès");
          }
        } else if (userType === "admin") {
          const { error: adminError } = await supabase
            .from('utilisateurs')
            .insert([
              { id: data.user.id, email: email, nom: email.split('@')[0] || 'Admin', role: 'admin' }
            ]);
          
          if (adminError) {
            console.error("Erreur lors de la création du profil admin:", adminError);
            console.error("Détails de l'erreur:", adminError.details, adminError.hint, adminError.message);
            toast.error("Profil administrateur partiellement créé. Veuillez contacter l'administrateur.");
          }
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
        toast.success("Inscription réussie! Vérifiez votre email pour confirmer votre compte.");
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
