
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, CornerDownLeft } from "lucide-react";

interface VoiceControlsProps {
  isRecording: boolean;
  hasTranscript: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSubmit: () => void;
}

const VoiceControls = ({ 
  isRecording, 
  hasTranscript, 
  onStartRecording, 
  onStopRecording, 
  onSubmit 
}: VoiceControlsProps) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      {isRecording ? (
        <Button onClick={onStopRecording} variant="destructive" className="gap-2">
          <StopCircle className="h-4 w-4" /> Stop Recording
        </Button>
      ) : (
        <Button onClick={onStartRecording} variant="outline" className="gap-2">
          <Mic className="h-4 w-4" /> {hasTranscript ? "Record Again" : "Start Recording"}
        </Button>
      )}
      
      {hasTranscript && !isRecording && (
        <Button onClick={onSubmit} className="gap-2">
          <CornerDownLeft className="h-4 w-4" /> Send
        </Button>
      )}
    </div>
  );
};

export default VoiceControls;
