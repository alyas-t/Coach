
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import PageTransition from "@/components/layout/PageTransition";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If not logged in, redirect to auth page
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Check if the user has already completed onboarding
    const checkOnboardingStatus = async () => {
      try {
        // Check if the user has any goals set (indicating completed onboarding)
        const { data: goals, error: goalsError } = await supabase
          .from('goals')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);
          
        if (goalsError) throw goalsError;
        
        // Check if the user has coach settings (another onboarding indicator)
        const { data: coachSettings, error: settingsError } = await supabase
          .from('coach_settings')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);
          
        if (settingsError) throw settingsError;
        
        // If user has either goals or coach settings, they've likely completed onboarding
        if ((goals && goals.length > 0) || (coachSettings && coachSettings.length > 0)) {
          // Redirect to dashboard as they've already completed onboarding
          navigate('/dashboard');
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      }
    };
    
    checkOnboardingStatus();
  }, [user, navigate]);

  if (!user) return null;

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center py-16 px-4">
        <OnboardingFlow />
      </div>
    </PageTransition>
  );
};

export default Onboarding;
