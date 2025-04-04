
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and redirect accordingly
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        try {
          const userEmail = session.user.email;
          console.log(`Vérification de l'email ${userEmail} pour la redirection`);
          
          // Use user metadata if available
          const userMetadata = session.user.user_metadata;
          
          // First priority - check user_type in metadata (most reliable method)
          if (userMetadata?.user_type === 'admin') {
            console.log("Redirection vers /admin car user_type metadata est 'admin'");
            navigate('/admin', { replace: true });
            return;
          } else if (userMetadata?.user_type === 'client') {
            console.log("Redirection vers /client-dashboard car user_type metadata est 'client'");
            navigate('/client-dashboard', { replace: true });
            return;
          }
          
          // Special case for known admin emails
          if (userEmail === "leviwebert147@gmail.com" || userEmail?.includes("admin")) {
            console.log("Email identifié comme administrateur par convention");
            navigate('/admin', { replace: true });
            return;
          }
          
          // Check admin table
          const { data: adminData } = await supabase
            .from('utilisateurs')
            .select('role')
            .eq('email', userEmail)
            .eq('role', 'admin')
            .maybeSingle();

          if (adminData) {
            // If admin, redirect to admin dashboard
            console.log("Redirection vers /admin car l'utilisateur est un admin");
            navigate('/admin', { replace: true });
            return;
          }

          // Check if user is a client via email
          const { data: clientData } = await supabase
            .from('clients')
            .select('id')
            .eq('email', userEmail)
            .maybeSingle();

          if (clientData) {
            // If client, redirect to client dashboard
            console.log("Redirection vers /client-dashboard car l'utilisateur est un client");
            navigate('/client-dashboard', { replace: true });
            return;
          }

          // If user has no defined type
          console.log("L'utilisateur n'a pas de profil défini");
          toast.error("Votre compte n'est associé à aucun profil. Veuillez contacter l'administrateur.");
          await supabase.auth.signOut();
          navigate('/auth', { replace: true });
        } catch (error) {
          console.error("Erreur lors de la vérification du type d'utilisateur:", error);
          toast.error("Une erreur est survenue lors de la vérification de votre profil");
          navigate('/auth', { replace: true });
        }
      } else {
        // If user is not logged in, redirect to home page
        navigate('/', { replace: true });
      }
    };

    checkAuth();
  }, [navigate]);

  // Display a loading indicator while redirecting
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
};

export default Index;
