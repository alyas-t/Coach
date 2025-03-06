
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import PageTransition from "@/components/layout/PageTransition";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // If not logged in, redirect to auth page
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Check if the user has already completed onboarding
    const checkOnboardingStatus = async () => {
      try {
        setIsChecking(true);
        // Check if the user has any goals set (indicating completed onboarding)
        const { data: goals, error: goalsError } = await supabase
          .from('goals')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);
          
        if (goalsError) throw goalsError;
        
        // Check if the user has coach settings in their profile (another onboarding indicator)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('coach_style, coach_tone')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        
        // If user has either goals or coach settings defined in their profile, they've likely completed onboarding
        if ((goals && goals.length > 0) || 
            (profileData && (profileData.coach_style || profileData.coach_tone))) {
          // Redirect to dashboard as they've already completed onboarding
          navigate('/dashboard');
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkOnboardingStatus();
  }, [user, navigate]);

  if (!user) return null;

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center py-16 px-4">
        {isChecking ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Checking your profile...</p>
          </div>
        ) : (
          <OnboardingFlow />
        )}
      </div>
    </PageTransition>
  );
};

export default Onboarding;
