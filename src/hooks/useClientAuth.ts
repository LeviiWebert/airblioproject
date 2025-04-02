
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
    // Vérifier si l'utilisateur est connecté et est bien un client
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (!data.session) {
          console.log("Aucune session trouvée. Redirection vers /auth");
          navigate('/auth');
          setIsLoading(false);
          setIsAuthChecked(true);
          return;
        }
        
        const userId = data.session.user.id;
        
        // Vérifier si l'utilisateur existe dans la table clients
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', userId);
        
        if (clientError) {
          console.error("Erreur lors de la vérification du client:", clientError);
          await supabase.auth.signOut();
          navigate('/auth');
          setIsLoading(false);
          setIsAuthChecked(true);
          return;
        }
        
        // Si l'utilisateur n'est pas trouvé dans la table clients, le rediriger
        if (!clientData || clientData.length === 0) {
          console.log("L'utilisateur n'est pas un client. Redirection vers /auth");
          toast.error("Vous devez être connecté en tant que client pour accéder à cette page");
          await supabase.auth.signOut();
          navigate('/auth');
          setIsLoading(false);
          setIsAuthChecked(true);
          return;
        }
        
        // Récupérer le nom de l'utilisateur si disponible
        setUserName(clientData[0]?.nom_entreprise || data.session.user.email || "Client");
        setIsLoading(false);
        setIsAuthChecked(true);
        
        console.log("Client authentifié avec succès:", clientData[0]);
      } catch (error: any) {
        console.error("Erreur d'authentification:", error);
        toast.error("Erreur d'authentification: " + (error.message || "Connexion impossible"));
        setIsLoading(false);
        setIsAuthChecked(true);
        navigate('/auth');
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Vous avez été déconnecté avec succès");
      navigate('/auth');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  };

  return {
    userName,
    isLoading,
    isAuthChecked,
    handleLogout
  };
}
