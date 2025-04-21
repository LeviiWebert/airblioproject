import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isAdminUser } from "@/utils/authUtils";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and redirect accordingly
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate('/', { replace: true });
        return;
      }
      try {
        const userEmail = session.user.email;
        const userMetadata = session.user.user_metadata;
        // Détermine la destination cible
        let targetPath = null;

        if (userMetadata?.user_type === 'client') {
          targetPath = '/client-dashboard';
        } else if (userMetadata?.user_type === 'admin' || isAdminUser(userEmail, userMetadata)) {
          targetPath = '/admin';
        } else {
          // Vérification base SQL si metadata non défini
          const { data: adminData } = await supabase
            .from('utilisateurs')
            .select('role')
            .eq('email', userEmail)
            .eq('role', 'admin')
            .maybeSingle();

          if (adminData) targetPath = '/admin';
          else {
            const { data: clientData } = await supabase
              .from('clients')
              .select('id')
              .eq('email', userEmail)
              .maybeSingle();
            if (clientData) targetPath = '/client-dashboard';
          }
        }

        if (!targetPath) {
          toast.error("Votre compte n'est associé à aucun profil. Veuillez contacter l'administrateur.");
          await supabase.auth.signOut();
          navigate('/auth', { replace: true });
        } else {
          navigate(targetPath, { replace: true });
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du type d'utilisateur:", error);
        toast.error("Une erreur est survenue lors de la vérification de votre profil");
        navigate('/auth', { replace: true });
      }
    };

    checkAuth();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
};

export default Index;
