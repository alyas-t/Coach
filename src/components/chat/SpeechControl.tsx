
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import TextToSpeech from "@/utils/textToSpeech";

interface SpeechControlProps {
  tts: TextToSpeech;
  initialState?: boolean;
}

const SpeechControl = ({ tts, initialState = true }: SpeechControlProps) => {
  const [speechEnabled, setSpeechEnabled] = useState(initialState);

  const toggleSpeech = () => {
    const newState = tts.toggleEnabled();
    setSpeechEnabled(newState);
    toast.info(newState ? "Voice feedback enabled" : "Voice feedback disabled");
  };

  return (
    <Button 
      variant="outline"
      size="icon" 
      className="shrink-0"
      onClick={toggleSpeech}
      title={speechEnabled ? "Disable voice" : "Enable voice"}
    >
      {speechEnabled ? (
        <Volume2 className="h-5 w-5 text-muted-foreground" />
      ) : (
        <VolumeX className="h-5 w-5 text-muted-foreground" />
      )}
    </Button>
  );
};

export default SpeechControl;
