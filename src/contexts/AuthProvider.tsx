
import React, { createContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { checkUserType } from "@/utils/userTypeChecker";

export const AuthContext = createContext<{
  session: Session | null;
  user: User | null;
  userType: string | null;
  loading: boolean;
  initialized: boolean;
  clientId: string | null;
}>({
  session: null,
  user: null,
  userType: null,
  loading: true,
  initialized: false,
  clientId: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  // Fonction pour récupérer l'ID client à partir de l'email de l'utilisateur
  const fetchClientId = async (userId: string, email: string) => {
    try {
      console.log("Fetching client ID for:", email);
      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      if (error) {
        console.error("Erreur lors de la récupération de l'ID client par email:", error);
        // Essayer de récupérer par l'ID utilisateur
        const { data: dataById, error: errorById } = await supabase
          .from('clients')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
          
        if (errorById) {
          console.error("Erreur lors de la récupération de l'ID client par userId:", errorById);
          return null;
        }
        
        if (dataById) {
          console.log("Client ID trouvé par userId:", dataById.id);
          return dataById.id;
        }
        
        return null;
      }
      
      if (data) {
        console.log("Client ID trouvé par email:", data.id);
        return data.id;
      }
      
      return null;
    } catch (error) {
      console.error("Exception lors de la récupération de l'ID client:", error);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const getInitialSession = async () => {
      try {
        console.log("Récupération de la session initiale");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          try {
            const type = await checkUserType(session.user.id);
            console.log("Initial user type in AuthProvider:", type);
            
            if (!isMounted) return;
            setUserType(type);
            
            // Si c'est un client, récupérer son ID dans la table clients
            if (type === "client" && session.user.email) {
              const id = await fetchClientId(session.user.id, session.user.email);
              if (!isMounted) return;
              setClientId(id);
              console.log("Client ID récupéré:", id);
            }
          } catch (error) {
            console.error("Error checking user type:", error);
          }
        }
        
      } catch (error) {
        console.error("Error in AuthProvider initial session:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
          console.log("Auth provider initialized");
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Auth state changed in AuthProvider:", _event);
      
      if (!isMounted) return;
      
      setSession(session);
      setUser(session?.user || null);
      
      if (session?.user) {
        try {
          const type = await checkUserType(session.user.id);
          if (!isMounted) return;
          
          setUserType(type);
          console.log("Updated user type in AuthProvider:", type);
          
          // Si c'est un client, récupérer son ID dans la table clients
          if (type === "client" && session.user.email) {
            const id = await fetchClientId(session.user.id, session.user.email);
            if (!isMounted) return;
            
            setClientId(id);
            console.log("Client ID mis à jour:", id);
          } else {
            setClientId(null);
          }
        } catch (error) {
          console.error("Error checking user type in AuthProvider:", error);
        }
      } else {
        setUserType(null);
        setClientId(null);
      }
      
      setLoading(false);
      setInitialized(true);
    });

    getInitialSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    userType,
    loading,
    initialized,
    clientId,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
