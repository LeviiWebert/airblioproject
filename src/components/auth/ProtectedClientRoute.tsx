
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/hooks/useAuth";

export const ProtectedClientRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, userType, loading, initialized, clientId } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // L'attente est gérée par useAuth
        if (initialized) {
          if (!session) {
            toast.error("Veuillez vous connecter pour accéder à cette page");
          } else if (userType !== "client") {
            toast.error("Cette section est réservée aux clients");
          } else if (!clientId) {
            toast.error("Votre profil client n'est pas correctement configuré");
          }
          setIsCheckingAuth(false);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'authentification:", error);
        toast.error("Erreur lors de la vérification de vos droits d'accès");
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [session, userType, initialized, clientId]);

  if (loading || isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading />
      </div>
    );
  }

  if (!session || userType !== "client" || !clientId) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
