import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, ArrowRight } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import animations from "@/utils/animation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OnboardingFormData } from "./OnboardingFlow";

interface CoachPersonalityFormProps {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
  onSubmit: () => void;
  onPrev: () => void;
}

const CoachPersonalityForm = ({
  formData,
  updateFormData,
  onSubmit,
  onPrev,
}: CoachPersonalityFormProps) => {
  const [coachStyle, setCoachStyle] = useState(formData.coachStyle || "supportive");
  const [coachTone, setCoachTone] = useState(formData.coachTone || "friendly");
  const [intensity, setIntensity] = useState(formData.intensity || 3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFormData({ coachStyle, coachTone, intensity });
    onSubmit();
  };

  const coachStyleOptions = [
    {
      value: "supportive",
      label: "Supportive",
      description: "Encouraging and positive, focused on building confidence and motivation.",
      icon: "🤗"
    },
    {
      value: "directive",
      label: "Directive",
      description: "Clear instructions and guidance, telling you exactly what to do.",
      icon: "📝"
    },
    {
      value: "challenging",
      label: "Challenging",
      description: "Pushes you outside your comfort zone to achieve higher goals.",
      icon: "🔥"
    },
    {
      value: "analytical",
      label: "Analytical",
      description: "Data-driven approach focused on measuring and tracking progress.",
      icon: "📊"
    },
  ];

  const coachToneOptions = [
    {
      value: "friendly",
      label: "Friendly",
      description: "Casual, warm, and approachable communication style.",
      icon: "😊"
    },
    {
      value: "professional",
      label: "Professional",
      description: "Formal, business-like communication style focused on results.",
      icon: "👔"
    },
    {
      value: "motivational",
      label: "Motivational",
      description: "Inspiring and energetic, using powerful language to drive action.",
      icon: "💪"
    },
    {
      value: "direct",
      label: "Direct",
      description: "Straightforward and concise, getting to the point quickly.",
      icon: "⚡"
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
          <div className="space-y-4">
            <Label className="text-base">What coaching style do you prefer?</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {coachStyleOptions.map((style) => (
                <Card 
                  key={style.value}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    coachStyle === style.value ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setCoachStyle(style.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-2xl mb-2">{style.icon}</div>
                        <h3 className="font-medium">{style.label}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{style.description}</p>
                      </div>
                      {coachStyle === style.value && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <Label className="text-base">What tone of voice would you prefer?</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {coachToneOptions.map((tone) => (
                <Card 
                  key={tone.value}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    coachTone === tone.value ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setCoachTone(tone.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-2xl mb-2">{tone.icon}</div>
                        <h3 className="font-medium">{tone.label}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{tone.description}</p>
                      </div>
                      {coachTone === tone.value && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <Label className="text-base">Coaching Intensity</Label>
              <Badge variant="outline" className="font-normal">
                {intensity === 1 ? "Very Gentle" : 
                 intensity === 2 ? "Gentle" : 
                 intensity === 3 ? "Balanced" : 
                 intensity === 4 ? "Firm" : "Very Firm"}
              </Badge>
            </div>
            <Slider
              value={[intensity]}
              min={1}
              max={5}
              step={1}
              onValueChange={(value) => setIntensity(value[0])}
              className="py-4"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Gentle Support</span>
              <span>Balanced</span>
              <span>Strong Push</span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={animations.staggerItem} className="pt-4 flex justify-between">
        <Button type="button" variant="outline" onClick={onPrev}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button
          type="submit"
          className="gap-1"
        >
          Complete Setup <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.form>
  );
};

export default CoachPersonalityForm;
