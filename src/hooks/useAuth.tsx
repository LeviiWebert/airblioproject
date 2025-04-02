
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
  
  // Fonction pour vérifier le rôle de l'utilisateur
  const checkUserType = useCallback(async (userId: string) => {
    try {
      console.log("Vérification du type d'utilisateur:", userId);
      
      // Vérifier d'abord si l'utilisateur est un admin
      const { data: adminData, error: adminError } = await supabase
        .from('utilisateurs')
        .select('role')
        .eq('id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (adminError) {
        console.error("Erreur lors de la vérification du rôle admin:", adminError);
      }

      if (adminData) {
        console.log("Utilisateur identifié comme admin");
        return "admin";
      }

      // Si ce n'est pas un admin, vérifier s'il est un client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (clientError) {
        console.error("Erreur lors de la vérification du rôle client:", clientError);
      }

      if (clientData) {
        console.log("Utilisateur identifié comme client");
        return "client";
      }

      // Si l'utilisateur n'a pas de profil défini
      console.log("Utilisateur sans type défini");
      return null;
    } catch (error) {
      console.error("Erreur lors de la vérification du type d'utilisateur:", error);
      return null;
    }
  }, []);

  // Initialisation et écoute des changements d'authentification
  useEffect(() => {
    let mounted = true;
    
    // Configurer l'écouteur des changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Changement d'état d'authentification:", event);
      
      if (!mounted) return;
      
      if (newSession?.user?.id) {
        setSession(newSession);
        
        // Utiliser setTimeout pour éviter les problèmes de boucle infinie
        // avec les appels Supabase dans les callbacks d'événements d'auth
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

    // Récupérer la session existante
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

  // Fonction de connexion avec gestion d'erreurs améliorée
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Gestion améliorée des erreurs courantes
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
        const type = await checkUserType(userId);
        
        if (!type) {
          // Si l'utilisateur n'a pas de profil défini
          await supabase.auth.signOut();
          throw new Error("Votre compte n'est associé à aucun profil. Veuillez contacter l'administrateur.");
        }
        
        toast.success("Connexion réussie");
        
        // Redirection automatique vers le dashboard approprié
        if (type === "admin") {
          // Les administrateurs sont toujours redirigés vers le dashboard admin
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

  // Fonction d'inscription avec gestion d'erreurs améliorée et optimisation pour les administrateurs
  const signUp = async (email: string, password: string, userType: "admin" | "client") => {
    try {
      setLoading(true);
      
      // Vérifier que l'email n'est pas déjà utilisé dans la table spécifique
      const tableToCheck = userType === 'admin' ? 'utilisateurs' : 'clients';
      const { data: existingEmail, error: emailCheckError } = await supabase
        .from(tableToCheck)
        .select('email')
        .eq('email', email)
        .maybeSingle();
        
      if (emailCheckError) {
        console.error(`Erreur lors de la vérification de l'email dans ${tableToCheck}:`, emailCheckError);
      }
        
      if (existingEmail) {
        throw new Error(`Cet email est déjà associé à un compte ${userType}`);
      }
      
      // Créer le compte utilisateur
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
        if (error.message.includes('already registered')) {
          throw new Error("Cet email est déjà utilisé. Essayez de vous connecter.");
        } else if (error.message.includes('stronger password')) {
          throw new Error("Votre mot de passe est trop faible. Utilisez au moins 6 caractères avec des lettres et des chiffres.");
        } else {
          throw error;
        }
      }

      // Créer le profil utilisateur
      if (data.user) {
        if (userType === "client") {
          const { error: clientError } = await supabase
            .from('clients')
            .insert([
              { id: data.user.id, email: email, nom_entreprise: email.split('@')[0] }
            ]);
          
          if (clientError) {
            console.error("Erreur lors de la création du profil client:", clientError);
            // Ne pas annuler l'inscription, informer l'utilisateur uniquement
            toast.error("Profil client partiellement créé. Veuillez contacter l'administrateur pour compléter votre profil.");
          }
        } else if (userType === "admin") {
          // Créer le profil administrateur
          const { error: adminError } = await supabase
            .from('utilisateurs')
            .insert([
              { id: data.user.id, email: email, nom: email.split('@')[0], role: 'admin' }
            ]);
          
          if (adminError) {
            console.error("Erreur lors de la création du profil admin:", adminError);
            console.error("Détails de l'erreur:", adminError.details, adminError.hint, adminError.message);
            // Ne pas annuler l'inscription, informer l'utilisateur uniquement
            toast.error("Profil administrateur partiellement créé. Veuillez contacter l'administrateur pour compléter votre profil.");
          }
        }
      }

      // Gérer le retour selon la configuration de Supabase
      if (data.session) {
        // Force check le type d'utilisateur après création
        const type = await checkUserType(data.user!.id);
        setUserType(type);
        
        toast.success("Inscription réussie! Vous êtes maintenant connecté.");
        
        // Redirection automatique selon le type d'utilisateur
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

  // Fonction de déconnexion
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
