
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, CornerDownLeft, X } from "lucide-react";
import { motion } from "@/utils/animation";

interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  onCancel: () => void;
}

const VoiceInput = ({ onTranscript, onCancel }: VoiceInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [amplitude, setAmplitude] = useState(0);

  // Mock speech recognition - in a real app, this would use the Web Speech API
  useEffect(() => {
    if (isRecording) {
      // Simulate recording animation
      const intervalId = setInterval(() => {
        setAmplitude(Math.random() * 50 + 10);
      }, 100);
      
      // Simulate transcript updating
      const mockTranscripts = [
        "I...",
        "I'm feeling...",
        "I'm feeling pretty good today.",
        "I'm feeling pretty good today. I completed my morning workout.",
      ];
      
      let index = 0;
      const transcriptInterval = setInterval(() => {
        if (index < mockTranscripts.length) {
          setTranscript(mockTranscripts[index]);
          index++;
        } else {
          clearInterval(transcriptInterval);
        }
      }, 1000);
      
      return () => {
        clearInterval(intervalId);
        clearInterval(transcriptInterval);
      };
    }
  }, [isRecording]);

  const startRecording = () => {
    setIsRecording(true);
    setTranscript("");
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const submitTranscript = () => {
    if (transcript.trim()) {
      onTranscript(transcript);
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
        
        {transcript ? (
          <div className="mb-4 min-h-[60px]">
            <p className="text-sm font-medium mb-1">Voice Message:</p>
            <p>{transcript}</p>
          </div>
        ) : (
          <div className="mb-4 text-center py-4 text-muted-foreground">
            {isRecording ? "Listening..." : "Press the microphone button to start speaking"}
          </div>
        )}
        
        {isRecording && (
          <div className="mb-4 h-12 flex items-center justify-center">
            <div className="flex items-end space-x-1">
              {[...Array(20)].map((_, i) => {
                const height = Math.min(40, Math.max(3, amplitude * Math.sin(i / 2))) + 5;
                return (
                  <motion.div
                    key={i}
                    className="w-1 bg-primary rounded-full"
                    initial={{ height: 5 }}
                    animate={{ height }}
                    transition={{ duration: 0.1 }}
                  />
                );
              })}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-center space-x-2">
          {isRecording ? (
            <Button onClick={stopRecording} variant="destructive" className="gap-2">
              <StopCircle className="h-4 w-4" /> Stop Recording
            </Button>
          ) : (
            <Button onClick={startRecording} variant="outline" className="gap-2">
              <Mic className="h-4 w-4" /> {transcript ? "Record Again" : "Start Recording"}
            </Button>
          )}
          
          {transcript && !isRecording && (
            <Button onClick={submitTranscript} className="gap-2">
              <CornerDownLeft className="h-4 w-4" /> Send
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default VoiceInput;
