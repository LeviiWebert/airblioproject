
import React, { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté et rediriger en conséquence
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Vérifier le type d'utilisateur
        try {
          const userEmail = session.user.email;
          console.log(`Vérification de l'email ${userEmail} pour la redirection`);
          
          // Vérification critique - récupérer le metadata user_type si disponible
          const userMetadata = session.user.user_metadata;
          console.log("Metadata utilisateur:", userMetadata);
          
          if (userMetadata?.user_type === 'admin') {
            console.log("Redirection vers /admin car user_type metadata est 'admin'");
            navigate('/admin', { replace: true });
            return;
          }
          
          // Vérifier d'abord si l'utilisateur est un admin via l'email dans la table utilisateurs
          const { data: adminData, error: adminError } = await supabase
            .from('utilisateurs')
            .select('role')
            .eq('email', userEmail)
            .eq('role', 'admin')
            .maybeSingle();

          if (adminError) {
            console.error("Erreur lors de la vérification du rôle admin:", adminError);
          }

          if (adminData) {
            // Si c'est un admin, rediriger vers le dashboard admin
            console.log("Redirection vers /admin car l'utilisateur est un admin");
            navigate('/admin', { replace: true });
            return;
          }

          // Si ce n'est pas un admin, vérifier s'il est un client via l'email
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('id')
            .eq('email', userEmail)
            .maybeSingle();

          if (clientError) {
            console.error("Erreur lors de la vérification du rôle client:", clientError);
          }

          if (clientData) {
            // Si c'est un client, rediriger vers le dashboard client
            console.log("Redirection vers /client-dashboard car l'utilisateur est un client");
            navigate('/client-dashboard', { replace: true });
            return;
          }

          // Si nous ne trouvons pas de profil dans les tables, essayons de créer un profil
          // basé sur les métadonnées ou l'email de l'utilisateur
          
          // Si l'email contient "admin", on considère que c'est un admin par défaut
          if (userEmail?.includes("admin") || userEmail === "leviwebert147@gmail.com") {
            console.log("Email identifié comme administrateur par convention");
            
            // Auto-création d'un profil admin
            const { error: createError } = await supabase
              .from('utilisateurs')
              .insert([
                { 
                  id: session.user.id, 
                  email: userEmail, 
                  nom: userEmail?.split('@')[0] || 'Admin', 
                  role: 'admin' 
                }
              ]).select();
              
            if (createError) {
              console.error("Échec de l'auto-création du profil admin:", createError);
            } else {
              console.log("Profil admin auto-créé avec succès");
              navigate('/admin', { replace: true });
              return;
            }
          } else {
            // Auto-création d'un profil client par défaut
            const { error: createError } = await supabase
              .from('clients')
              .insert([
                { 
                  id: session.user.id, 
                  email: userEmail, 
                  nom_entreprise: userEmail?.split('@')[0] || 'Client'
                }
              ]).select();
              
            if (createError) {
              console.error("Échec de l'auto-création du profil client:", createError);
            } else {
              console.log("Profil client auto-créé avec succès");
              navigate('/client-dashboard', { replace: true });
              return;
            }
          }

          // Si l'utilisateur n'a pas de type défini
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
        // Si l'utilisateur n'est pas connecté, rediriger vers la page d'accueil
        navigate('/', { replace: true });
      }
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
