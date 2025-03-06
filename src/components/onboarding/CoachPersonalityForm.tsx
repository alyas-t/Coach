
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import animations from "@/utils/animation";

interface CoachPersonalityFormProps {
  formData: any;
  updateFormData: (data: any) => void;
  onSubmit: () => void;
  onPrev: () => void;
}

const CoachPersonalityForm = ({
  formData,
  updateFormData,
  onSubmit,
  onPrev,
}: CoachPersonalityFormProps) => {
  const [coachStyle, setCoachStyle] = useState<string>(
    formData.coachStyle || "supportive"
  );
  const [coachTone, setCoachTone] = useState<string>(
    formData.coachTone || "friendly"
  );
  const [intensity, setIntensity] = useState<number[]>(
    formData.intensity ? [formData.intensity] : [3]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFormData({
      coachStyle,
      coachTone,
      intensity: intensity[0],
    });
    onSubmit();
  };

  const styles = [
    {
      id: "supportive",
      name: "Supportive",
      description: "Focuses on encouragement and positive reinforcement.",
    },
    {
      id: "directive",
      name: "Directive",
      description: "Provides clear instructions and detailed guidance.",
    },
    {
      id: "challenging",
      name: "Challenging",
      description: "Pushes you outside your comfort zone to achieve more.",
    },
  ];

  const tones = [
    {
      id: "friendly",
      name: "Friendly",
      description: "Warm, personable, and conversational.",
    },
    {
      id: "professional",
      name: "Professional",
      description: "Focused, straightforward, and results-oriented.",
    },
    {
      id: "motivational",
      name: "Motivational",
      description: "Inspirational, passionate, and energetic.",
    },
  ];

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      variants={animations.staggerContainer}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={animations.staggerItem}>
        <h2 className="text-2xl font-medium mb-6">Customize Your Coach</h2>

        <div className="space-y-6">
          {/* Coaching Style */}
          <div className="space-y-3">
            <Label className="text-base">Coaching Style</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {styles.map((style) => (
                <Card
                  key={style.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    coachStyle === style.id
                      ? "border-primary ring-1 ring-primary/30"
                      : "hover:border-primary/30"
                  }`}
                  onClick={() => setCoachStyle(style.id)}
                >
                  <CardContent className="p-4 relative">
                    {coachStyle === style.id && (
                      <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-0.5">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                    <h3 className="font-medium mb-1">{style.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {style.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Communication Tone */}
          <div className="space-y-3">
            <Label className="text-base">Communication Tone</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {tones.map((tone) => (
                <Card
                  key={tone.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    coachTone === tone.id
                      ? "border-primary ring-1 ring-primary/30"
                      : "hover:border-primary/30"
                  }`}
                  onClick={() => setCoachTone(tone.id)}
                >
                  <CardContent className="p-4 relative">
                    {coachTone === tone.id && (
                      <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-0.5">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                    <h3 className="font-medium mb-1">{tone.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tone.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Coaching Intensity */}
          <div className="space-y-3">
            <Label className="text-base">Coaching Intensity</Label>
            <div className="px-2">
              <Slider
                value={intensity}
                onValueChange={setIntensity}
                max={5}
                step={1}
                className="my-6"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Gentle</span>
                <span>Balanced</span>
                <span>Intense</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={animations.staggerItem}
        className="pt-4 flex justify-between"
      >
        <Button type="button" variant="outline" onClick={onPrev}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button type="submit" className="gap-1">
          Get Started <ChevronRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.form>
  );
};

export default CoachPersonalityForm;
