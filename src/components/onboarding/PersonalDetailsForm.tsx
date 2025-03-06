
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion } from "@/utils/animation";
import { ArrowRight } from "lucide-react";

interface PersonalDetailsFormProps {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
}

const PersonalDetailsForm = ({
  formData,
  updateFormData,
  onNext,
}: PersonalDetailsFormProps) => {
  const [name, setName] = useState(formData.name || "");
  const [age, setAge] = useState(formData.age || "");
  const [focusAreas, setFocusAreas] = useState<string[]>(
    formData.focusAreas || []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFormData({ name, age, focusAreas });
    onNext();
  };

  const toggleFocusArea = (area: string) => {
    if (focusAreas.includes(area)) {
      setFocusAreas(focusAreas.filter((a) => a !== area));
    } else {
      setFocusAreas([...focusAreas, area]);
    }
  };

  const focusAreaOptions = [
    "Health & Fitness",
    "Career Growth",
    "Learning & Education",
    "Relationships",
    "Personal Development",
    "Productivity",
    "Finance",
    "Mindfulness",
  ];

  const isFormValid = name.trim() !== "" && age !== "" && focusAreas.length > 0;

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      variants={motion.staggerContainer}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={motion.staggerItem}>
        <h2 className="text-2xl font-medium mb-6">Tell us about yourself</h2>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">What should we call you?</Label>
            <Input
              id="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="focus-ring"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              placeholder="Your age"
              min="1"
              max="120"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="focus-ring w-32"
              required
            />
          </div>
        </div>
      </motion.div>

      <motion.div variants={motion.staggerItem} className="space-y-3">
        <Label>What areas would you like to focus on?</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {focusAreaOptions.map((area) => (
            <Button
              key={area}
              type="button"
              variant={focusAreas.includes(area) ? "default" : "outline"}
              className={`justify-start h-auto p-3 transition-all ${
                focusAreas.includes(area)
                  ? "border-primary/50"
                  : "border-border hover:border-primary/30"
              }`}
              onClick={() => toggleFocusArea(area)}
            >
              <span className="text-sm">{area}</span>
            </Button>
          ))}
        </div>
        {focusAreas.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Please select at least one area
          </p>
        )}
      </motion.div>

      <motion.div variants={motion.staggerItem} className="pt-4 flex justify-end">
        <Button
          type="submit"
          disabled={!isFormValid}
          className="w-full sm:w-auto gap-1"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.form>
  );
};

export default PersonalDetailsForm;
