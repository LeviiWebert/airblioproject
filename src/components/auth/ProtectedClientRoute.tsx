
import { ReactNode, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";
import { supabase } from "@/integrations/supabase/client";

type ProtectedClientRouteProps = {
  children: ReactNode;
};

export const ProtectedClientRoute = ({ children }: ProtectedClientRouteProps) => {
  const { session, userType, loading, initialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Vérification additionnelle avec Supabase
    const verifyClientAccess = async () => {
      if (!session?.user) return;
      
      try {
        // Vérifier d'abord les métadonnées
        const userMetadata = session.user.user_metadata;
        if (userMetadata?.user_type === 'admin') {
          console.log("Metadata indique un admin. Redirection vers /admin");
          toast.error("Accès non autorisé. Cette section est réservée aux clients.");
          navigate("/admin", { replace: true });
          return;
        }
        
        // Vérifier si l'utilisateur existe dans la table clients
        const { data: clientData, error } = await supabase
          .from('clients')
          .select('id')
          .eq('email', session.user.email)
          .maybeSingle();
          
        if (error || !clientData) {
          console.log("Utilisateur non trouvé dans la table clients:", error);
          toast.error("Votre compte n'est pas associé à un profil client.");
          navigate("/auth", { replace: true });
        }
      } catch (err) {
        console.error("Erreur de vérification client:", err);
      }
    };
    
    // Vérification supplémentaire de sécurité
    if (initialized && !loading && session) {
      if (userType !== "client") {
        console.log("Type d'utilisateur n'est pas client:", userType);
        toast.error("Accès non autorisé. Cette section est réservée aux clients.");
        navigate("/auth", { replace: true });
      } else {
        verifyClientAccess();
      }
    }
  }, [session, userType, loading, initialized, navigate]);

  // Affichage pendant le chargement
  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading />
      </div>
    );
  }

  // Redirection si pas de session
  if (!session) {
    console.log("Pas de session active. Redirection vers /auth");
    return <Navigate to="/auth" replace />;
  }

  // Redirection si pas client
  if (userType !== "client") {
    console.log("Utilisateur non client. Redirection vers /auth");
    toast.error("Accès non autorisé. Cette section est réservée aux clients.");
    return <Navigate to="/auth" replace />;
  }

  // Si l'utilisateur est authentifié et est un client, afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedClientRoute;
