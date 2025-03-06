
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import PageTransition from "@/components/layout/PageTransition";

const Onboarding = () => {
  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center py-16 px-4">
        <OnboardingFlow />
      </div>
    </PageTransition>
  );
};

export default Onboarding;
