
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PersonalDetailsForm from "./PersonalDetailsForm";
import GoalSettingForm from "./GoalSettingForm";
import CoachPersonalityForm from "./CoachPersonalityForm";
import animations from "@/utils/animation";
import { CheckIcon, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useFocusAreas } from "@/hooks/useFocusAreas";
import { useGoals } from "@/hooks/useGoals";
import { useCoachSettings } from "@/hooks/useCoachSettings";
import { toast } from "sonner";
import TextToSpeech from "@/utils/textToSpeech";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const steps = [
  { id: 1, name: "Personal Details" },
  { id: 2, name: "Goals" },
  { id: 3, name: "Coach Personality" },
];

// Explicitly define the interface for the form data
export interface OnboardingFormData {
  name: string;
  age: string;
  focusAreas: string[];
  goals: any[];
  coachStyle: string;
  coachTone: string;
  intensity: number;
}

const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Ensure the initial state exactly matches the interface
  const [formData, setFormData] = useState<OnboardingFormData>({
    name: "",
    age: "",
    focusAreas: [],
    goals: [],
    coachStyle: "supportive",
    coachTone: "friendly",
    intensity: 3,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateProfile } = useProfile();
  const { saveFocusAreas } = useFocusAreas();
  const { saveGoals } = useGoals();
  const { saveCoachSettings } = useCoachSettings();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Explicitly type the function parameter
  const updateFormData = (data: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmitOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmitOnboarding = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await updateProfile({
        name: formData.name,
        age: parseInt(formData.age as string)
      });
      
      if (formData.focusAreas && formData.focusAreas.length > 0) {
        await saveFocusAreas(formData.focusAreas);
      }
      
      if (formData.goals && formData.goals.length > 0) {
        await saveGoals(formData.goals);
      }
      
      // Explicitly define the object to match CoachSettings interface
      await saveCoachSettings({
        coachStyle: formData.coachStyle,
        coachTone: formData.coachTone,
        intensity: formData.intensity // Use the defined property directly
      });
      
      const textToSpeech = TextToSpeech.getInstance();
      
      if (formData.coachTone === 'friendly') {
        textToSpeech.setVoicePreference('Samantha');
      } else if (formData.coachTone === 'professional') {
        textToSpeech.setVoicePreference('Google UK English Male');
      } else if (formData.coachTone === 'motivational') {
        textToSpeech.setVoicePreference('Microsoft David');
      }
      
      toast.success("Onboarding completed successfully!");
      
      setTimeout(() => {
        navigate("/dashboard");
        
        const welcomeMessage = `Hi ${formData.name}! I'm your personal coach. I'm here to help you with your ${
          formData.focusAreas?.join(', ') || 'personal'
        } goals. Let's get started!`;
        
        setTimeout(() => {
          textToSpeech.speak(welcomeMessage);
        }, 500);
      }, 1000);
    } catch (error: any) {
      console.error("Error submitting onboarding data:", error);
      setError(error.message || "There was an error saving your data. Please try again.");
      toast.error("There was an error saving your data. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleErrorRetry = () => {
    setError(null);
    setIsSubmitting(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex flex-col items-center relative w-1/3"
            >
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                  step.id < currentStep
                    ? "bg-primary text-white"
                    : step.id === currentStep
                    ? "border-2 border-primary bg-white text-primary"
                    : "border-2 border-gray-300 bg-white text-gray-400"
                }`}
                initial={false}
                animate={{
                  scale: step.id === currentStep ? 1.1 : 1,
                  transition: { type: "spring", stiffness: 300, damping: 20 },
                }}
              >
                {step.id < currentStep ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  <span>{step.id}</span>
                )}
              </motion.div>
              <span
                className={`mt-2 text-xs font-medium ${
                  step.id <= currentStep
                    ? "text-primary"
                    : "text-gray-400"
                }`}
              >
                {step.name}
              </span>

              {step.id < steps.length && (
                <div
                  className={`absolute top-4 left-1/2 w-full h-[2px] ${
                    step.id < currentStep ? "bg-primary" : "bg-gray-300"
                  }`}
                  style={{ transform: "translateY(-50%)" }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 md:p-8 relative overflow-hidden">
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-50">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Saving your information...</p>
            </div>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto" 
              onClick={handleErrorRetry}
            >
              Try Again
            </Button>
          </Alert>
        )}
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-[400px]"
          >
            {currentStep === 1 && (
              <PersonalDetailsForm
                formData={formData}
                updateFormData={updateFormData}
                onNext={nextStep}
              />
            )}
            {currentStep === 2 && (
              <GoalSettingForm
                formData={formData}
                updateFormData={updateFormData}
                onNext={nextStep}
                onPrev={prevStep}
              />
            )}
            {currentStep === 3 && (
              <CoachPersonalityForm
                formData={formData}
                updateFormData={updateFormData}
                onSubmit={nextStep}
                onPrev={prevStep}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingFlow;
