
import React, { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté et rediriger en conséquence
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Vérifier le type d'utilisateur
        try {
          // Vérifier d'abord si l'utilisateur est un admin
          const { data: adminData } = await supabase
            .from('utilisateurs')
            .select('role')
            .eq('id', session.user.id)
            .eq('role', 'admin')
            .maybeSingle();

          if (adminData) {
            // Si c'est un admin, rediriger vers le dashboard admin
            navigate('/admin', { replace: true });
            return;
          }

          // Si ce n'est pas un admin, vérifier s'il est un client
          const { data: clientData } = await supabase
            .from('clients')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();

          if (clientData) {
            // Si c'est un client, rediriger vers le dashboard client
            navigate('/client-dashboard', { replace: true });
            return;
          }
        } catch (error) {
          console.error("Erreur lors de la vérification du type d'utilisateur:", error);
        }
      }
      
      // Par défaut ou si aucun type d'utilisateur n'est détecté, rediriger vers la page d'accueil
      navigate('/', { replace: true });
    };

    checkAuth();
  }, [navigate]);

  // Afficher un chargement en attendant la redirection
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
};

export default Index;
