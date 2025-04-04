
import { ReactNode, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";

type ProtectedAdminRouteProps = {
  children: ReactNode;
};

export const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const { session, userType, loading, initialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Vérification supplémentaire de sécurité
    if (initialized && !loading && session && userType !== "admin") {
      toast.error("Accès non autorisé. Vous n'avez pas les droits administrateur.");
      navigate("/auth", { replace: true });
    }
  }, [session, userType, loading, initialized, navigate]);

  // Affichage pendant le chargement
  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  // Redirection si pas de session ou pas admin
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (userType !== "admin") {
    toast.error("Accès non autorisé. Vous n'avez pas les droits administrateur.");
    return <Navigate to="/auth" replace />;
  }

  // Si l'utilisateur est authentifié et est un admin, afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedAdminRoute;
