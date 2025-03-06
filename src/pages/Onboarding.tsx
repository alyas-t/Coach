
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import PageTransition from "@/components/layout/PageTransition";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState<boolean>(false);

  useEffect(() => {
    // If not logged in, redirect to auth page
    if (!user) {
      navigate('/auth');
      return;
    }
    
    let timeoutId: number;
    
    // Check if the user has already completed onboarding
    const checkOnboardingStatus = async () => {
      try {
        setIsChecking(true);
        setError(null);
        
        // Set a timeout to detect if checking takes too long
        timeoutId = window.setTimeout(() => {
          setLoadingTimeout(true);
        }, 5000);
        
        // Simplified check: we'll just start onboarding if we can't determine status
        let hasCompletedOnboarding = false;
        
        try {
          // Try to check if the user has any goals set
          const { data: goals, error: goalsError } = await supabase
            .from('goals')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);
            
          if (!goalsError && goals && goals.length > 0) {
            hasCompletedOnboarding = true;
          }
          
          // Only check profile if goals check didn't confirm completion
          if (!hasCompletedOnboarding) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('coach_style, coach_tone')
              .eq('id', user.id)
              .maybeSingle();
              
            if (!profileError && profileData && (profileData.coach_style || profileData.coach_tone)) {
              hasCompletedOnboarding = true;
            }
          }
        } catch (err) {
          console.error("Error in onboarding checks:", err);
          // If there's an error, we'll just continue to onboarding
        }
        
        if (hasCompletedOnboarding) {
          navigate('/dashboard');
        }
      } catch (error: any) {
        console.error("Error checking onboarding status:", error);
        setError(`Could not check onboarding status: ${error.message || "Unknown error"}`);
      } finally {
        clearTimeout(timeoutId);
        setIsChecking(false);
      }
    };
    
    checkOnboardingStatus();
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [user, navigate]);

  const handleRetry = () => {
    setLoadingTimeout(false);
    window.location.reload();
  };

  const handleSkipToOnboarding = () => {
    setIsChecking(false);
    setLoadingTimeout(false);
    setError(null);
  };

  if (!user) return null;

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center py-16 px-4">
        {isChecking ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Checking your profile...</p>
            
            {loadingTimeout && (
              <div className="mt-6 text-center">
                <p className="text-yellow-600 dark:text-yellow-400 mb-2">
                  This is taking longer than expected.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleRetry} variant="outline" size="sm">
                    Try Again
                  </Button>
                  <Button onClick={handleSkipToOnboarding} size="sm">
                    Skip to Onboarding
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center space-y-4 max-w-md text-center">
            <p className="text-destructive">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleRetry} variant="outline">
                Try Again
              </Button>
              <Button onClick={handleSkipToOnboarding}>
                Continue to Onboarding
              </Button>
            </div>
          </div>
        ) : (
          <OnboardingFlow />
        )}
      </div>
    </PageTransition>
  );
};

export default Onboarding;
