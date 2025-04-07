
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/hooks/useAuth";

export const ProtectedClientRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, userType, loading, initialized, clientId } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authTimeout, setAuthTimeout] = useState<NodeJS.Timeout | null>(null);

  // Set a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isCheckingAuth) {
        console.log("Auth checking timeout reached in ProtectedClientRoute");
        setIsCheckingAuth(false);
        toast.error("Vérification d'authentification trop longue. Veuillez vous reconnecter.");
      }
    }, 8000); // 8 seconds should be enough
    
    setAuthTimeout(timeout);
    
    return () => {
      if (authTimeout) clearTimeout(authTimeout);
      clearTimeout(timeout);
    };
  }, [isCheckingAuth, authTimeout]);

  useEffect(() => {
    // Only proceed with auth checking when initialized state is known
    if (initialized) {
      if (!session) {
        toast.error("Veuillez vous connecter pour accéder à cette page");
      } else if (userType !== "client") {
        toast.error("Cette section est réservée aux clients");
      } else if (!clientId) {
        toast.error("Votre profil client n'est pas correctement configuré");
      }
      
      // Always set checking to false once initialized
      setIsCheckingAuth(false);
    }
  }, [session, userType, initialized, clientId]);

  if (loading || (isCheckingAuth && !initialized)) {
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
