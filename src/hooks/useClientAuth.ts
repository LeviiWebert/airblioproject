
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
    let mounted = true;
    
    // Fonction pour vérifier le rôle client
    const checkClientRole = async (userId: string) => {
      try {
        console.log("Vérification du rôle client pour l'utilisateur:", userId);
        
        // Récupérer les informations de l'utilisateur pour avoir l'email
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("Utilisateur introuvable");
          setIsLoading(false);
          setIsAuthChecked(true);
          return;
        }
        
        // Vérifier si l'utilisateur existe dans la table clients
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();
        
        if (clientError) {
          console.error("Erreur lors de la vérification du client:", clientError);
          
          // Vérifier si l'utilisateur est un admin
          const { data: adminData } = await supabase
            .from('utilisateurs')
            .select('role')
            .eq('email', user.email)
            .eq('role', 'admin')
            .maybeSingle();
            
          if (adminData) {
            console.log("L'utilisateur est un admin, redirection vers /admin");
            navigate('/admin');
          } else {
            console.log("L'utilisateur n'est pas un client ou admin valide");
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
          if (mounted) navigate('/auth');
          return;
        }
        
        if (mounted) await checkClientRole(data.session.user.id);
      } catch (error: any) {
        console.error("Erreur d'authentification:", error);
        if (mounted) {
          toast.error("Erreur d'authentification: " + (error.message || "Connexion impossible"));
          setIsLoading(false);
          setIsAuthChecked(true);
          navigate('/auth');
        }
      }
    };
    
    // Configurer l'écouteur de changement d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Event d'authentification:", event);
      
      if (!session) {
        console.log("Pas de session active dans l'événement auth change");
        if (mounted) {
          setIsLoading(false);
          setIsAuthChecked(true);
          return;
        }
      }

      if (mounted) await checkClientRole(session.user.id);
    });
    
    // Vérification initiale de l'authentification
    checkAuth();
    
    // Nettoyer l'abonnement à la déconnexion du composant
    return () => {
      mounted = false;
      subscription.unsubscribe();
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
