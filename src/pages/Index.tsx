
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
        // Check user type
        try {
          const userEmail = session.user.email;
          console.log(`Vérification de l'email ${userEmail} pour la redirection`);
          
          // Critical check - get user_type from metadata if available
          const userMetadata = session.user.user_metadata;
          console.log("Metadata utilisateur:", userMetadata);
          
          // Special case for known admin emails
          if (userEmail === "leviwebert147@gmail.com" || userEmail?.includes("admin")) {
            console.log("Email identifié comme administrateur par convention");
            
            // Check if admin profile exists
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
                    id: session.user.id, 
                    email: userEmail, 
                    nom: userEmail.split('@')[0], 
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
            }
            
            if (existingAdmin) {
              console.log("Profil admin trouvé, redirection vers /admin");
              navigate('/admin', { replace: true });
              return;
            }
          }
          
          // First priority - check user_type in metadata
          if (userMetadata?.user_type === 'admin') {
            console.log("Redirection vers /admin car user_type metadata est 'admin'");
            
            // Ensure admin profile exists
            const { data: adminProfileData, error: adminProfileError } = await supabase
              .from('utilisateurs')
              .select('id')
              .eq('id', session.user.id)
              .maybeSingle();
              
            if (!adminProfileData && !adminProfileError) {
              // Create admin profile if it doesn't exist
              const { error: createProfileError } = await supabase
                .from('utilisateurs')
                .insert([
                  { 
                    id: session.user.id, 
                    email: userEmail, 
                    nom: userEmail?.split('@')[0] || 'Admin', 
                    role: 'admin' 
                  }
                ]);
                
              if (createProfileError) {
                console.error("Échec de l'auto-création du profil admin depuis metadata:", createProfileError);
              } else {
                console.log("Profil admin auto-créé depuis metadata avec succès");
              }
            }
            
            navigate('/admin', { replace: true });
            return;
          }
          
          // Second priority - check admin table
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
            // If admin, redirect to admin dashboard
            console.log("Redirection vers /admin car l'utilisateur est un admin");
            navigate('/admin', { replace: true });
            return;
          }

          // If not admin, check if user is a client via email
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('id')
            .eq('email', userEmail)
            .maybeSingle();

          if (clientError) {
            console.error("Erreur lors de la vérification du rôle client:", clientError);
          }

          if (clientData) {
            // If client, redirect to client dashboard
            console.log("Redirection vers /client-dashboard car l'utilisateur est un client");
            navigate('/client-dashboard', { replace: true });
            return;
          }

          // If no profile found in tables, try to create profile
          // based on metadata or email
          
          // Auto-create client profile by default if no other match found
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
