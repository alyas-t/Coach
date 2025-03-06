
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { motion } from "@/utils/animation";
import { toast } from "sonner";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import SpeechTranscript from "./voice/SpeechTranscript";
import VoiceVisualizer from "./voice/VoiceVisualizer";
import VoiceControls from "./voice/VoiceControls";

interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  onCancel: () => void;
}

const VoiceInput = ({ onTranscript, onCancel }: VoiceInputProps) => {
  const { 
    isRecording, 
    transcript, 
    amplitude, 
    startRecording, 
    stopRecording, 
    setTranscript 
  } = useVoiceRecording();

  const submitTranscript = () => {
    if (transcript.trim()) {
      onTranscript(transcript);
    } else {
      toast.error("No speech detected. Please try again.");
    }
  };

  return (
    <motion.div 
      className="border-t p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-4 bg-muted/30 rounded-lg border border-border relative">
        <div className="absolute top-2 right-2">
          <Button 
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-7 w-7"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <SpeechTranscript 
          transcript={transcript} 
          isRecording={isRecording} 
        />
        
        <VoiceVisualizer 
          isRecording={isRecording} 
          amplitude={amplitude} 
        />
        
        <VoiceControls 
          isRecording={isRecording}
          hasTranscript={Boolean(transcript)}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onSubmit={submitTranscript}
        />
      </div>
    </motion.div>
  );
};

export default VoiceInput;
