
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
  const fetchClientId = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      if (error) {
        console.error("Erreur lors de la récupération de l'ID client:", error);
        return null;
      }
      
      return data?.id || null;
    } catch (error) {
      console.error("Exception lors de la récupération de l'ID client:", error);
      return null;
    }
  };

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          const type = await checkUserType(session.user.id);
          setUserType(type);
          console.log("Initial user type in AuthProvider:", type);
          
          // Si c'est un client, récupérer son ID dans la table clients
          if (type === "client" && session.user.email) {
            const id = await fetchClientId(session.user.email);
            setClientId(id);
            console.log("Client ID récupéré:", id);
          }
        }
      } catch (error) {
        console.error("Error in AuthProvider initial session:", error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Auth state changed in AuthProvider:", _event);
      setSession(session);
      setUser(session?.user || null);
      
      if (session?.user) {
        try {
          const type = await checkUserType(session.user.id);
          setUserType(type);
          console.log("Updated user type in AuthProvider:", type);
          
          // Si c'est un client, récupérer son ID dans la table clients
          if (type === "client" && session.user.email) {
            const id = await fetchClientId(session.user.email);
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
