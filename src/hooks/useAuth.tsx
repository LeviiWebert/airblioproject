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
  
  // Function to check user type with improved reliability
  const checkUserType = useCallback(async (userId: string) => {
    try {
      console.log("Vérification du type d'utilisateur:", userId);
      
      // Get the authenticated user data
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("Pas d'utilisateur trouvé");
        return null;
      }
      
      const userEmail = user.email;
      console.log(`Vérification de l'email ${userEmail} pour la redirection`);
      
      // Critical check - get user_type from metadata if available
      const userMetadata = user.user_metadata;
      console.log("Metadata utilisateur:", userMetadata);
      
      // Special case for known admin emails
      if (userEmail === "leviwebert147@gmail.com" || userEmail?.includes("admin")) {
        console.log("Email identifié comme administrateur par convention");
        
        // Check if admin profile already exists
        const { data: existingAdmin, error: checkError } = await supabase
          .from('utilisateurs')
          .select('id, role')
          .eq('email', userEmail)
          .maybeSingle();
          
        // If admin profile doesn't exist, create it
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
      
      // First priority: Check user_type in metadata
      if (userMetadata?.user_type === 'admin') {
        console.log("Utilisateur identifié comme admin via metadata");
        
        // Ensure admin profile exists
        const { data: existingAdminProfile, error: checkProfileError } = await supabase
          .from('utilisateurs')
          .select('id')
          .eq('email', userEmail)
          .maybeSingle();
          
        if (!existingAdminProfile && !checkProfileError) {
          // Create admin profile if it doesn't exist
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
        
        // Ensure client profile exists
        const { data: existingClientProfile, error: checkClientProfileError } = await supabase
          .from('clients')
          .select('id')
          .eq('email', userEmail)
          .maybeSingle();
          
        if (!existingClientProfile && !checkClientProfileError) {
          // Create client profile if it doesn't exist
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
      
      // Second priority: Check in utilisateurs table (admin)
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
      
      // Third priority: Check in clients table
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

  // Initialize auth and set up listeners
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

  // Fixed signup function to ensure proper role assignment
  const signUp = async (email: string, password: string, userType: "admin" | "client") => {
    try {
      setLoading(true);
      console.log(`Tentative d'inscription en tant que ${userType} pour: ${email}`);
      
      // Check if email is already in use in the specific table
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
      
      // Create user account with user type in metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType // Store user type in metadata
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

      // Create user profile based on type
      if (data.user) {
        if (userType === "client") {
          const { error: clientError } = await supabase
            .from('clients')
            .insert([
              { id: data.user.id, email: email, nom_entreprise: email.split('@')[0] }
            ]);
          
          if (clientError) {
            console.error("Erreur lors de la création du profil client:", clientError);
            toast.error("Profil client partiellement créé. Veuillez contacter l'administrateur pour compléter votre profil.");
          }
        } else if (userType === "admin") {
          // Create admin profile with explicit role specified
          const { error: adminError } = await supabase
            .from('utilisateurs')
            .insert([
              { id: data.user.id, email: email, nom: email.split('@')[0], role: 'admin' }
            ]);
          
          if (adminError) {
            console.error("Erreur lors de la création du profil admin:", adminError);
            console.error("Détails de l'erreur:", adminError.details, adminError.hint, adminError.message);
            toast.error("Profil administrateur partiellement créé. Veuillez contacter l'administrateur pour compléter votre profil.");
          }
        }
      }

      // Handle session based on Supabase configuration
      if (data.session) {
        // Force check user type after creation
        const type = await checkUserType(data.user!.id);
        setUserType(type);
        
        toast.success("Inscription réussie! Vous êtes maintenant connecté.");
        
        // Automatic redirection based on user type
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

  // Function to sign in with error handling
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log(`Tentative de connexion pour: ${email}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Enhanced error handling for common errors
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
          // If user has no defined profile
          await supabase.auth.signOut();
          throw new Error("Votre compte n'est associé à aucun profil. Veuillez contacter l'administrateur.");
        }
        
        toast.success("Connexion réussie");
        
        // Automatic redirection to appropriate dashboard
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

  // Function to sign out
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
