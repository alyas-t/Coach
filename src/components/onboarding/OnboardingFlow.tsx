
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import StepProgress from "./StepProgress";
import PersonalDetailsForm from "./PersonalDetailsForm";
import GoalSettingForm from "./GoalSettingForm";
import CoachPersonalityForm from "./CoachPersonalityForm";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useFocusAreas } from "@/hooks/useFocusAreas";
import { useGoals } from "@/hooks/useGoals";
import { useCoachSettings } from "@/hooks/useCoachSettings";
import { toast } from "sonner";
import TextToSpeech from "@/utils/textToSpeech";

const steps = [
  { id: 1, name: "Personal Details" },
  { id: 2, name: "Goals" },
  { id: 3, name: "Coach Personality" },
];

const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    focusAreas: [],
    goals: [],
    coachStyle: "supportive",
    coachTone: "friendly",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  const updateFormData = (data: Partial<typeof formData>) => {
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
    try {
      // Update profile
      await updateProfile({
        name: formData.name,
        age: parseInt(formData.age as string)
      });
      
      // Save focus areas
      await saveFocusAreas(formData.focusAreas as string[]);
      
      // Save goals
      await saveGoals(formData.goals as any[]);
      
      // Save coach settings
      await saveCoachSettings({
        coachStyle: formData.coachStyle,
        coachTone: formData.coachTone
      });
      
      // Configure text-to-speech based on coach personality
      const textToSpeech = TextToSpeech.getInstance();
      
      // Set voice based on chosen personality
      if (formData.coachTone === 'friendly') {
        textToSpeech.setVoicePreference('Samantha');
      } else if (formData.coachTone === 'professional') {
        textToSpeech.setVoicePreference('Google UK English Male');
      } else if (formData.coachTone === 'motivational') {
        textToSpeech.setVoicePreference('Microsoft David');
      }
      
      // Welcome message
      const welcomeMessage = `Hi ${formData.name}! I'm your personal coach. I'm here to help you with your ${
        (formData.focusAreas as string[]).join(', ')
      } goals. Let's get started!`;
      
      // Show success toast and speak welcome message
      toast.success("Onboarding completed successfully!");
      
      // Speak welcome message and navigate when done
      textToSpeech.speak(welcomeMessage, () => {
        navigate("/dashboard");
      });
    } catch (error) {
      console.error("Error submitting onboarding data:", error);
      toast.error("There was an error saving your data. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <StepProgress steps={steps} currentStep={currentStep} />

      {/* Step Content */}
      <div className="glass-card rounded-xl p-6 md:p-8 relative overflow-hidden">
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Saving your information...</p>
            </div>
          </div>
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
