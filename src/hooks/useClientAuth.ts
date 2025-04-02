
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function useClientAuth() {
  const [userName, setUserName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    let authSubscription: { unsubscribe: () => void } | null = null;
    
    // Fonction pour vérifier le rôle client
    const checkClientRole = async (userId: string) => {
      try {
        console.log("Vérification du rôle client pour l'utilisateur:", userId);
        
        // Vérifier si l'utilisateur existe dans la table clients
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (clientError) {
          console.error("Erreur lors de la vérification du client:", clientError);
          
          // Vérifier si l'utilisateur est un admin
          const { data: adminData, error: adminError } = await supabase
            .from('utilisateurs')
            .select('role')
            .eq('id', userId)
            .eq('role', 'admin')
            .single();
            
          if (!adminError && adminData) {
            console.log("L'utilisateur est un admin, redirection vers /admin");
            navigate('/admin');
          } else {
            console.log("L'utilisateur n'est pas un client ou admin valide");
            await supabase.auth.signOut();
            toast.error("Compte utilisateur non trouvé. Veuillez contacter l'administrateur.");
            navigate('/auth');
          }
          
          setIsLoading(false);
          setIsAuthChecked(true);
          return;
        }
        
        // Si l'utilisateur est trouvé dans la table clients
        if (clientData) {
          console.log("Client authentifié avec succès:", clientData);
          // Récupérer le nom de l'utilisateur si disponible
          setUserName(clientData?.nom_entreprise || "Client");
        } else {
          console.log("L'utilisateur n'est pas un client. Redirection vers /auth");
          toast.error("Vous devez être connecté en tant que client pour accéder à cette page");
          await supabase.auth.signOut();
          navigate('/auth');
        }
        
        setIsLoading(false);
        setIsAuthChecked(true);
      } catch (error: any) {
        console.error("Erreur lors de la vérification du rôle client:", error);
        toast.error("Erreur d'authentification: " + (error.message || "Connexion impossible"));
        setIsLoading(false);
        setIsAuthChecked(true);
        navigate('/auth');
      }
    };
    
    // Fonction pour vérifier la session actuelle
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (!data.session) {
          console.log("Aucune session trouvée. Redirection vers /auth");
          setIsLoading(false);
          setIsAuthChecked(true);
          return;
        }
        
        await checkClientRole(data.session.user.id);
      } catch (error: any) {
        console.error("Erreur d'authentification:", error);
        toast.error("Erreur d'authentification: " + (error.message || "Connexion impossible"));
        setIsLoading(false);
        setIsAuthChecked(true);
      }
    };
    
    // Configurer l'écouteur de changement d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Event d'authentification:", event);
      
      if (!session) {
        console.log("Pas de session active dans l'événement auth change");
        setIsLoading(false);
        setIsAuthChecked(true);
        return;
      }

      await checkClientRole(session.user.id);
    });
    
    // Assigner correctement l'abonnement pour pouvoir se désabonner plus tard
    authSubscription = { unsubscribe: () => subscription.unsubscribe() };
    
    // Vérification initiale de l'authentification
    checkAuth();
    
    // Nettoyer l'abonnement à la déconnexion du composant
    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      toast.success("Vous avez été déconnecté avec succès");
      navigate('/auth');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast.error("Erreur lors de la déconnexion");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    userName,
    isLoading,
    isAuthChecked,
    handleLogout
  };
}
