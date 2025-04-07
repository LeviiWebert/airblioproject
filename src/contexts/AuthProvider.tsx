
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
}>({
  session: null,
  user: null,
  userType: null,
  loading: true,
  initialized: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

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
        } catch (error) {
          console.error("Error checking user type in AuthProvider:", error);
        }
      } else {
        setUserType(null);
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
