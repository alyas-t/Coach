
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

interface UseSpeechRecognitionProps {
  onTranscript?: (transcript: string) => void;
  onSpeechEnd?: () => void;
  autoRestart?: boolean;
  stopWhenSpeaking?: boolean;
  speaking?: boolean;
}

export function useSpeechRecognition({
  onTranscript,
  onSpeechEnd,
  autoRestart = true,
  stopWhenSpeaking = true,
  speaking = false,
}: UseSpeechRecognitionProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  
  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const transcriptValue = result[0].transcript;
        setTranscript(transcriptValue);
        onTranscript?.(transcriptValue);
      };
      
      recognitionRef.current.onend = () => {
        // If we're not actively stopping recognition, restart it automatically
        if (isListening && autoRestart && !speaking) {
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error("Error restarting recognition:", error);
          }
        } else {
          onSpeechEnd?.();
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          toast.error("Microphone access denied. Please allow microphone access to use voice chat.");
          setIsListening(false);
        }
      };
    } else {
      toast.error("Your browser doesn't support speech recognition. Please try a different browser.");
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error("Error stopping recognition:", error);
        }
      }
    };
  }, [autoRestart, isListening, onSpeechEnd, onTranscript, speaking]);

  // Handle when AI is speaking
  useEffect(() => {
    if (stopWhenSpeaking && speaking && recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Error stopping recognition while AI speaking:", error);
      }
    } else if (isListening && !speaking && recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setTranscript("");
      } catch (error) {
        console.error("Error starting recognition after AI speech:", error);
      }
    }
  }, [speaking, isListening, stopWhenSpeaking]);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setTranscript("");
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        toast.error("Could not start speech recognition");
      }
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Error stopping recognition:", error);
      }
    }
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    setTranscript
  };
}
