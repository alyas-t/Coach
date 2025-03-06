
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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error fetching session:", error);
      }
      
      setSession(data.session);
      setUser(data.session?.user || null);
      setIsLoading(false);
    };

    fetchSession();

    const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);
      
      if (event === 'SIGNED_IN' && newSession) {
        setIsLoading(true);
        try {
          // Check if the user has completed onboarding by checking for goals or coach settings
          const { data: goals, error: goalsError } = await supabase
            .from('goals')
            .select('id')
            .eq('user_id', newSession.user.id)
            .limit(1);
            
          if (goalsError) throw goalsError;
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('coach_style, coach_tone')
            .eq('id', newSession.user.id)
            .single();
            
          if (profileError && profileError.code !== 'PGRST116') throw profileError;
          
          // If the user has no goals and no coach settings, redirect to onboarding
          const needsOnboarding = (!goals || goals.length === 0) && 
                                (!profileData || (!profileData.coach_style && !profileData.coach_tone));
          
          if (needsOnboarding) {
            navigate('/onboarding');
          } else {
            // Only redirect to dashboard if we're not on a specific page already
            if (location.pathname === '/' || location.pathname === '/auth') {
              navigate('/dashboard');
            }
          }
        } catch (error) {
          console.error("Error checking onboarding status:", error);
          // If there's an error, it's safer to redirect to onboarding
          navigate('/onboarding');
        } finally {
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        navigate('/');
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true);
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
      setIsLoading(false);
      throw error;
    }

    toast.success("Account created! Please check your email for verification.");
    setIsLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      throw error;
    }

    setIsLoading(false);
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
        setIsLoading(false);
        throw error;
      }

      // No need to set loading to false here as the redirect will happen
    } catch (error: any) {
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast.error(error.message);
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
