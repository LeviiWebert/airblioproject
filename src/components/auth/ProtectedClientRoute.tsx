
import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/hooks/useAuth";

export const ProtectedClientRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, userType, loading, initialized, clientId } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authTimeout, setAuthTimeout] = useState<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  // Set a timeout to prevent infinite loading
  useEffect(() => {
    if (isCheckingAuth) {
      console.log("Starting auth check timeout in ProtectedClientRoute");
      const timeout = setTimeout(() => {
        console.log("Auth checking timeout reached in ProtectedClientRoute");
        setIsCheckingAuth(false);
        toast.error("Vérification d'authentification trop longue. Veuillez vous reconnecter.");
        navigate('/auth', { replace: true });
      }, 5000); // Reduced to 5 seconds for faster feedback
      
      setAuthTimeout(timeout);
      
      return () => {
        if (authTimeout) clearTimeout(authTimeout);
        clearTimeout(timeout);
      };
    }
  }, [isCheckingAuth, authTimeout, navigate]);

  // Process auth state once initialized
  useEffect(() => {
    // Only proceed with auth checking when initialized state is known
    if (initialized) {
      console.log("Auth initialized in ProtectedClientRoute, processing auth state");
      
      if (!session) {
        console.log("No session in ProtectedClientRoute");
        toast.error("Veuillez vous connecter pour accéder à cette page");
      } else if (userType !== "client") {
        console.log("Non-client user type in ProtectedClientRoute:", userType);
        toast.error("Cette section est réservée aux clients");
      } else if (!clientId) {
        console.log("No client ID in ProtectedClientRoute");
        toast.error("Votre profil client n'est pas correctement configuré");
      }
      
      // Always set checking to false once initialized to prevent hanging
      setIsCheckingAuth(false);
    }
  }, [session, userType, initialized, clientId]);

  // Show loading state
  if (loading || (isCheckingAuth && !initialized)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading />
      </div>
    );
  }

  // Handle redirect cases
  if (!session) {
    console.log("Redirecting to /auth: No session");
    return <Navigate to="/auth" replace />;
  }
  
  if (userType !== "client") {
    console.log("Redirecting to /auth: Not a client user");
    return <Navigate to="/auth" replace />;
  }
  
  if (!clientId) {
    console.log("Redirecting to /auth: No client ID");
    return <Navigate to="/auth" replace />;
  }

  // Allow access to the protected route
  return <>{children}</>;
};
