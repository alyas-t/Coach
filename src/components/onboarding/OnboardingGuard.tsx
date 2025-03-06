
import { useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Loader2 } from "lucide-react";

interface OnboardingGuardProps {
  children: ReactNode;
}

export const OnboardingGuard = ({ children }: OnboardingGuardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const { user } = useAuth();
  const { getProfile } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const checkOnboardingStatus = async () => {
      try {
        const profile = await getProfile();
        // Check if profile has essential onboarding data
        const hasCompletedOnboarding = !!(profile && 
          profile.name && 
          profile.coach_style && 
          profile.coach_tone);
        
        setHasCompletedOnboarding(hasCompletedOnboarding);
        
        if (!hasCompletedOnboarding) {
          navigate('/onboarding');
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user, navigate, getProfile]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Checking your profile...</p>
        </div>
      </div>
    );
  }

  return hasCompletedOnboarding ? children : null;
};
