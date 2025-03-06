
import { Loader2, Volume2 } from "lucide-react";

interface TranscriptDisplayProps {
  transcript: string;
  isProcessing: boolean;
  aiSpeaking: boolean;
  isListening: boolean;
}

const TranscriptDisplay = ({ 
  transcript, 
  isProcessing, 
  aiSpeaking, 
  isListening 
}: TranscriptDisplayProps) => {
  return (
    <div className="mb-4 p-4 bg-muted/20 rounded-lg border border-border min-h-[100px] text-center">
      {isProcessing ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Processing your message...</span>
        </div>
      ) : aiSpeaking ? (
        <div className="flex items-center justify-center h-full">
          <Volume2 className="h-5 w-5 text-primary animate-pulse mr-2" />
          <span className="text-muted-foreground">AI speaking...</span>
        </div>
      ) : transcript ? (
        <p className="text-base">{transcript}</p>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          {isListening ? "I'm listening... speak now" : "Click the microphone to start speaking"}
        </div>
      )}
    </div>
  );
};

export default TranscriptDisplay;
