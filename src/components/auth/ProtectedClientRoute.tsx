
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const ProtectedClientRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, userType, loading, initialized, clientId } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (initialized) setIsCheckingAuth(false);
  }, [initialized]);

  if (loading || (isCheckingAuth && !initialized)) {
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
            <p>Vous devez être connecté pour accéder à cette page client.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (userType !== "client") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Accès interdit</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Cette section est réservée aux clients. Accès refusé.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!clientId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Profil incomplet</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Votre compte client n’est pas correctement configuré.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

