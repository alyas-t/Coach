import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, CornerDownLeft, X } from "lucide-react";
import { motion } from "@/utils/animation";
import { toast } from "sonner";

interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  onCancel: () => void;
}

const VoiceInput = ({ onTranscript, onCancel }: VoiceInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [amplitude, setAmplitude] = useState(0);
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    // Initialize Web Speech API
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
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          toast.error("Microphone access denied. Please allow microphone access to use voice input.");
        } else if (event.error === 'network') {
          toast.error("Network error. Please check your connection.");
        } else {
          toast.error(`Recognition error: ${event.error}`);
        }
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        // Only restart if we're still meant to be recording
        if (isRecording) {
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error("Error restarting recognition:", error);
          }
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
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isRecording]);
  
  // Handle audio visualization
  useEffect(() => {
    if (isRecording) {
      // Set up audio visualization
      const setupAudioVisualization = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;
          
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          audioContextRef.current = new AudioContext();
          analyserRef.current = audioContextRef.current.createAnalyser();
          
          const source = audioContextRef.current.createMediaStreamSource(stream);
          source.connect(analyserRef.current);
          
          analyserRef.current.fftSize = 256;
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          
          const updateAmplitude = () => {
            if (analyserRef.current && isRecording) {
              analyserRef.current.getByteFrequencyData(dataArray);
              
              // Calculate average amplitude
              let sum = 0;
              for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
              }
              const avg = sum / bufferLength;
              setAmplitude(avg);
              
              requestAnimationFrame(updateAmplitude);
            }
          };
          
          updateAmplitude();
        } catch (error) {
          console.error("Error accessing microphone:", error);
          toast.error("Could not access microphone. Please check your permissions.");
          setIsRecording(false);
        }
      };
      
      setupAudioVisualization();
    } else {
      // Clean up
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  }, [isRecording]);

  const startRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        setTranscript("");
        
        // Auto-stop after 60 seconds to prevent very long recordings
        setTimeout(() => {
          if (isRecording) {
            stopRecording();
            toast.info("Recording automatically stopped after 60 seconds");
          }
        }, 60000);
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        toast.error("Could not start speech recognition");
      }
    } else {
      toast.error("Speech recognition not available");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

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
                const height = Math.min(40, Math.max(3, amplitude * Math.sin(i / 2) * 0.5)) + 5;
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
