
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [authStateInitialized, setAuthStateInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    
    const fetchSession = async () => {
      try {
        console.log("Fetching initial session");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error fetching session:", error);
          if (isMounted) {
            setIsLoading(false);
            setInitialLoad(false);
            setAuthStateInitialized(true);
          }
          return;
        }
        
        if (isMounted) {
          setSession(data.session);
          setUser(data.session?.user || null);
          
          // Don't redirect on initial load
          if (data.session?.user && initialLoad) {
            console.log("User is already logged in:", data.session.user.email);
          }
          
          setIsLoading(false);
          setInitialLoad(false);
          setAuthStateInitialized(true);
        }
      } catch (e) {
        console.error("Exception fetching session:", e);
        if (isMounted) {
          setIsLoading(false);
          setInitialLoad(false);
          setAuthStateInitialized(true);
        }
      }
    };

    fetchSession();

    const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state changed:", event, !!newSession);
      
      if (isMounted) {
        setSession(newSession);
        setUser(newSession?.user || null);
      }
      
      if (event === 'SIGNED_IN' && newSession && isMounted) {
        // Don't set loading again to prevent infinite loops
        try {
          const currentPath = location.pathname;
          
          // Only redirect if on login or home page and not during initial load
          if ((currentPath === '/' || currentPath === '/auth') && !initialLoad) {
            console.log("Redirecting to onboarding after sign in");
            navigate('/onboarding');
          }
        } catch (error) {
          console.error("Error handling sign in redirect:", error);
        }
      } else if (event === 'SIGNED_OUT' && isMounted) {
        navigate('/');
      }
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [navigate, location.pathname, initialLoad]);

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });

      if (error) {
        toast.error(error.message);
        throw error;
      }

      toast.success("Account created! Please check your email for verification.");
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast.error(error.message || "Failed to create account");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast.error(error.message);
        throw error;
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast.error(error.message || "Failed to sign in");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        toast.error(error.message);
        throw error;
      }
    } catch (error: any) {
      console.error("Google sign in error:", error);
      toast.error(error.message || "Failed to sign in with Google");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(error.message || "Failed to sign out");
      throw error;
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}
