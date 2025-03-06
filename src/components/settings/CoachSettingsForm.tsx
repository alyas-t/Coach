
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { TimePicker } from "@/components/settings/TimePicker";
import { useCoachSettings } from "@/hooks/useCoachSettings";
import { toast } from "sonner";

interface CoachSettingsFormProps {
  onSettingsSaved?: () => void;
}

const CoachSettingsForm = ({ onSettingsSaved }: CoachSettingsFormProps) => {
  // Form state
  const [coachStyle, setCoachStyle] = useState("supportive");
  const [coachTone, setCoachTone] = useState("friendly");
  const [intensity, setIntensity] = useState(3);
  const [morningTime, setMorningTime] = useState("08:00");
  const [eveningTime, setEveningTime] = useState("20:00");
  
  // Loading and form states
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFormChanged, setIsFormChanged] = useState(false);
  
  // Initial values for comparison
  const [initialValues, setInitialValues] = useState({
    coachStyle: "",
    coachTone: "",
    intensity: 0,
    morningTime: "",
    eveningTime: ""
  });
  
  const { getCoachSettings, saveCoachSettings, isLoading } = useCoachSettings();
  
  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getCoachSettings();
        
        if (settings) {
          setCoachStyle(settings.coachStyle);
          setCoachTone(settings.coachTone);
          setIntensity(settings.intensity || 3);
          setMorningTime(settings.morningTime || "08:00");
          setEveningTime(settings.eveningTime || "20:00");
          
          // Store initial values for comparison
          setInitialValues({
            coachStyle: settings.coachStyle,
            coachTone: settings.coachTone,
            intensity: settings.intensity || 3,
            morningTime: settings.morningTime || "08:00",
            eveningTime: settings.eveningTime || "20:00"
          });
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setIsInitializing(false);
      }
    };
    
    loadSettings();
  }, []);
  
  // Check if form values have changed
  useEffect(() => {
    if (isInitializing) return;
    
    const hasChanged = 
      coachStyle !== initialValues.coachStyle ||
      coachTone !== initialValues.coachTone ||
      intensity !== initialValues.intensity ||
      morningTime !== initialValues.morningTime ||
      eveningTime !== initialValues.eveningTime;
    
    setIsFormChanged(hasChanged);
  }, [coachStyle, coachTone, intensity, morningTime, eveningTime, initialValues, isInitializing]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormChanged) {
      toast.info("No changes to save");
      return;
    }
    
    try {
      const result = await saveCoachSettings({
        coachStyle,
        coachTone,
        intensity,
        morningTime,
        eveningTime
      });
      
      if (result) {
        // Update initial values to match current values
        setInitialValues({
          coachStyle,
          coachTone,
          intensity,
          morningTime,
          eveningTime
        });
        
        setIsFormChanged(false);
        
        if (onSettingsSaved) {
          onSettingsSaved();
        }
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Coaching Style</CardTitle>
          <CardDescription>
            Customize how your AI coach interacts with you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="text-base">Coaching Approach</Label>
              <RadioGroup
                value={coachStyle}
                onValueChange={setCoachStyle}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="supportive" id="supportive" />
                  <Label htmlFor="supportive" className="font-normal">
                    Supportive (encouraging, positive)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="directive" id="directive" />
                  <Label htmlFor="directive" className="font-normal">
                    Directive (clear instructions, guidance)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="challenging" id="challenging" />
                  <Label htmlFor="challenging" className="font-normal">
                    Challenging (pushes you, ambitious)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="analytical" id="analytical" />
                  <Label htmlFor="analytical" className="font-normal">
                    Analytical (data-driven, practical)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base">Communication Style</Label>
              <RadioGroup
                value={coachTone}
                onValueChange={setCoachTone}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="friendly" id="friendly" />
                  <Label htmlFor="friendly" className="font-normal">
                    Friendly (warm, conversational)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="professional" id="professional" />
                  <Label htmlFor="professional" className="font-normal">
                    Professional (formal, respectful)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="direct" id="direct" />
                  <Label htmlFor="direct" className="font-normal">
                    Direct (straightforward, concise)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="motivational" id="motivational" />
                  <Label htmlFor="motivational" className="font-normal">
                    Motivational (energetic, inspiring)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-base">Coach Intensity</Label>
                <span className="text-sm text-muted-foreground">
                  Level: {intensity}
                </span>
              </div>
              <Slider
                value={[intensity]}
                min={1}
                max={5}
                step={1}
                onValueChange={(value) => setIntensity(value[0])}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Gentle</span>
                <span>Balanced</span>
                <span>Intense</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Check-in Schedule</CardTitle>
          <CardDescription>
            Set your preferred times for morning and evening check-ins
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="morning-time">Morning Check-in</Label>
              <TimePicker
                id="morning-time"
                value={morningTime}
                onChange={setMorningTime}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evening-time">Evening Check-in</Label>
              <TimePicker
                id="evening-time"
                value={eveningTime}
                onChange={setEveningTime}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isLoading || !isFormChanged}
          className="min-w-32"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </div>
    </form>
  );
};

export default CoachSettingsForm;
