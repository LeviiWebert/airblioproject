
import { useState, useEffect, createContext, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkUserType } from "@/utils/userTypeChecker";
import { createClientProfile, createAdminProfile } from "@/utils/authUtils";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userType: string | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, userType: "admin" | "client") => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const setUpAuthStateListener = () => {
      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          console.log("Auth state changed:", event);
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (currentSession?.user) {
            // Defer the call to checkUserType to avoid recursive Supabase calls in the callback
            setTimeout(async () => {
              try {
                const type = await checkUserType(currentSession.user.id);
                setUserType(type);
                console.log("User type detected:", type);
              } catch (error) {
                console.error("Error checking user type in auth change:", error);
              }
            }, 0);
          } else {
            setUserType(null);
          }
        }
      );

      // Initial session check
      supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          try {
            const type = await checkUserType(initialSession.user.id);
            setUserType(type);
            console.log("Initial user type:", type);
          } catch (error) {
            console.error("Error checking initial user type:", error);
          }
        }

        setLoading(false);
        setInitialized(true);
      });

      return subscription;
    };

    const subscription = setUpAuthStateListener();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    try {
      setLoading(true);
      console.log("Attempting to sign in:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      console.log("Sign in successful for:", email);
      const session = data.session;
      const user = session.user;
      
      // Determine user type after login
      const type = await checkUserType(user.id);
      console.log("User type after login:", type);
      
      return type;
    } catch (error: any) {
      console.error("Error signing in:", error.message);
      toast.error(`Erreur de connexion: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userType: "admin" | "client"): Promise<string | null> => {
    try {
      setLoading(true);
      
      // Set metadata for user type
      const metadata = { user_type: userType };
      
      // Create the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: window.location.origin + '/auth',
        }
      });
      
      if (error) {
        throw error;
      }
      
      // If Supabase is configured to not require email confirmation, the user will be signed in immediately
      if (data.session) {
        const userId = data.user.id;
        
        // Create the appropriate profile
        if (userType === "admin") {
          await createAdminProfile(userId, email);
          return "admin";
        } else {
          await createClientProfile(userId, email);
          return "client";
        }
      }
      
      toast.success("Inscription réussie! Vérifiez votre email pour confirmer votre compte.");
      return null;
    } catch (error: any) {
      console.error("Error signing up:", error.message);
      toast.error(`Erreur d'inscription: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      toast.success("Vous avez été déconnecté");
      navigate('/auth');
    } catch (error: any) {
      console.error("Error signing out:", error.message);
      toast.error(`Erreur de déconnexion: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      userType,
      loading,
      initialized,
      signIn,
      signUp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default useAuth;
