
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PersonalDetailsForm from "./PersonalDetailsForm";
import GoalSettingForm from "./GoalSettingForm";
import CoachPersonalityForm from "./CoachPersonalityForm";
import animations from "@/utils/animation";
import { CheckIcon } from "lucide-react";

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
  const navigate = useNavigate();

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Save data and redirect to dashboard
      console.log("Form submitted:", formData);
      navigate("/dashboard");
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Progress Steps */}
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

              {/* Connector line */}
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

      {/* Step Content */}
      <div className="glass-card rounded-xl p-6 md:p-8 relative overflow-hidden">
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
