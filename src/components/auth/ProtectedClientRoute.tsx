
import { ReactNode, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";

type ProtectedClientRouteProps = {
  children: ReactNode;
};

export const ProtectedClientRoute = ({ children }: ProtectedClientRouteProps) => {
  const { session, userType, loading, initialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Vérification supplémentaire de sécurité
    if (initialized && !loading && session && userType !== "client") {
      toast.error("Accès non autorisé. Cette section est réservée aux clients.");
      navigate("/auth", { replace: true });
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

  // Redirection si pas de session ou pas client
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (userType !== "client") {
    toast.error("Accès non autorisé. Cette section est réservée aux clients.");
    return <Navigate to="/auth" replace />;
  }

  // Si l'utilisateur est authentifié et est un client, afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedClientRoute;
