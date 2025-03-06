
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface VoiceCheckInProps {
  onTranscription: (text: string) => void;
}

const VoiceCheckIn = ({ onTranscription }: VoiceCheckInProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");

  // Use browser's built-in speech recognition
  const startRecording = async () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        toast.error("Your browser doesn't support speech recognition. Please try a different browser.");
        return;
      }
      
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      // Reset the transcript
      transcriptRef.current = "";
      
      recognitionRef.current.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        transcriptRef.current = transcript;
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
          toast.error("Microphone access denied. Please allow microphone access to use voice input.");
        } else {
          toast.error(`Recognition error: ${event.error}`);
        }
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        if (isRecording) {
          // Auto-submit on stop
          submitTranscription();
        }
      };
      
      recognitionRef.current.start();
      setIsRecording(true);
      
      // Auto-stop after 30 seconds
      timeoutRef.current = window.setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 30000);
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      toast.error("Could not start speech recognition");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsRecording(false);
  };

  const submitTranscription = async () => {
    if (!transcriptRef.current.trim()) {
      toast.error("No speech detected. Please try again.");
      return;
    }
    
    // For backup, try to use Gemini to process the transcript
    setIsTranscribing(true);
    
    try {
      // Try using the built-in transcript first
      onTranscription(transcriptRef.current);
      toast.success("Voice transcribed successfully");
    } catch (error: any) {
      console.error("Error with transcription:", error);
      toast.error("Failed to transcribe: " + (error.message || "Unknown error"));
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <Button
      type="button"
      variant={isRecording ? "destructive" : "outline"}
      size="sm"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isTranscribing}
      className="flex items-center gap-2"
    >
      {isTranscribing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Transcribing...</span>
        </>
      ) : isRecording ? (
        <>
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span>Stop Recording</span>
        </>
      ) : (
        <>
          <Mic className="h-4 w-4" />
          <span>Voice Input</span>
        </>
      )}
    </Button>
  );
};

export default VoiceCheckIn;
