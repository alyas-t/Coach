
import { motion } from "framer-motion";
import { CheckIcon } from "lucide-react";

interface Step {
  id: number;
  name: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
}

const StepProgress = ({ steps, currentStep }: StepProgressProps) => {
  return (
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
  );
};

export default StepProgress;
