
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
    // Configurer l'écouteur de changement d'authentification avant de vérifier la session
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
    
    // Vérifier si l'utilisateur est connecté et est bien un client
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
    
    checkAuth();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);
  
  // Fonction séparée pour vérifier le rôle client
  const checkClientRole = async (userId: string) => {
    try {
      // Vérifier si l'utilisateur existe dans la table clients
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (clientError) {
        console.error("Erreur lors de la vérification du client:", clientError);
        
        // Vérifier si l'utilisateur est un admin (dans ce cas, on le redirige vers /admin)
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
          navigate('/auth');
        }
        
        setIsLoading(false);
        setIsAuthChecked(true);
        return;
      }
      
      // Si l'utilisateur n'est pas trouvé dans la table clients, le rediriger
      if (!clientData) {
        console.log("L'utilisateur n'est pas un client. Redirection vers /auth");
        toast.error("Vous devez être connecté en tant que client pour accéder à cette page");
        await supabase.auth.signOut();
        navigate('/auth');
        setIsLoading(false);
        setIsAuthChecked(true);
        return;
      }
      
      // Récupérer le nom de l'utilisateur si disponible
      setUserName(clientData?.nom_entreprise || "Client");
      setIsLoading(false);
      setIsAuthChecked(true);
      
      console.log("Client authentifié avec succès:", clientData);
    } catch (error: any) {
      console.error("Erreur lors de la vérification du rôle client:", error);
      toast.error("Erreur d'authentification: " + (error.message || "Connexion impossible"));
      setIsLoading(false);
      setIsAuthChecked(true);
      navigate('/auth');
    }
  };

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
