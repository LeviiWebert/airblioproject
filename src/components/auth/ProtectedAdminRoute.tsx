
import { ReactNode, useEffect } from "react";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type ProtectedAdminRouteProps = {
  children: ReactNode;
};

export const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const { session, userType, loading, initialized } = useAuth();

  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Accès refusé</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Vous devez être connecté pour accéder à cette section administrateur.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (userType !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Accès non autorisé</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Vous n’avez pas les droits administrateur requis.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si l'utilisateur est authentifié et est un admin, afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedAdminRoute;
