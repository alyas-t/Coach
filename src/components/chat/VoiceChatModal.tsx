import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Mic, StopCircle, Volume2, Loader2 } from "lucide-react";
import { motion } from "@/utils/animation";
import { toast } from "sonner";
import TextToSpeech from "@/utils/textToSpeech";

interface VoiceChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => Promise<void>;
}

const VoiceChatModal = ({ isOpen, onClose, onSendMessage }: VoiceChatModalProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [processingTimeout, setProcessingTimeout] = useState<number | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const tts = useRef(TextToSpeech.getInstance());
  
  useEffect(() => {
    if (isOpen) {
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
        
        recognitionRef.current.onend = () => {
          if (isListening && !aiSpeaking && !isProcessing) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.error("Error restarting recognition:", error);
            }
          }
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          if (event.error === 'not-allowed') {
            toast.error("Microphone access denied. Please allow microphone access to use voice chat.");
            onClose();
          } else if (event.error === 'network') {
            toast.error("Network error. Please check your connection.");
          } else {
            toast.error(`Recognition error: ${event.error}`);
          }
        };
      } else {
        toast.error("Your browser doesn't support speech recognition. Please try a different browser.");
        onClose();
      }
      
      tts.current.onSpeakStart(() => setAiSpeaking(true));
      tts.current.onSpeakEnd(() => setAiSpeaking(false));
      
      startListening();
    }
    
    return () => {
      stopListening();
      cleanupAudio();
      clearProcessingTimeout();
      
      const ttsInstance = tts.current;
      ttsInstance.offSpeakStart(() => setAiSpeaking(true));
      ttsInstance.offSpeakEnd(() => setAiSpeaking(false));
    };
  }, [isOpen]);
  
  useEffect(() => {
    if (!transcript || isProcessing || aiSpeaking) return;
    
    const timer = setTimeout(() => {
      if (transcript.trim() && isListening) {
        sendTranscriptToAI();
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [transcript, isListening, isProcessing, aiSpeaking]);
  
  useEffect(() => {
    if (isListening && !audioContextRef.current) {
      setupAudioVisualization();
    }
    
    const updateAmplitude = () => {
      if (analyserRef.current && isListening) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        setAmplitude(aiSpeaking ? 0 : avg);
        
        if (isListening) {
          requestAnimationFrame(updateAmplitude);
        }
      }
    };
    
    if (isListening && analyserRef.current) {
      updateAmplitude();
    }
  }, [isListening, aiSpeaking]);
  
  useEffect(() => {
    if (aiSpeaking && recognitionRef.current) {
      recognitionRef.current.stop();
    } else if (isListening && !aiSpeaking && recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setTranscript("");
      } catch (error) {
        console.error("Error starting recognition after AI speech:", error);
      }
    }
  }, [aiSpeaking, isListening]);
  
  const clearProcessingTimeout = () => {
    if (processingTimeout !== null) {
      clearTimeout(processingTimeout);
      setProcessingTimeout(null);
    }
  };

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
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone. Please check your permissions.");
      setIsListening(false);
    }
  };
  
  const cleanupAudio = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      analyserRef.current = null;
    }
  };

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

  const sendTranscriptToAI = async () => {
    if (!transcript.trim() || isProcessing) return;
    
    const message = transcript;
    setTranscript("");
    setIsProcessing(true);
    
    const timeout = window.setTimeout(() => {
      toast.error("AI response is taking longer than expected. Please try again with a shorter message.");
      setIsProcessing(false);
    }, 15000);
    
    setProcessingTimeout(timeout);
    
    try {
      console.log("Sending transcript to AI:", message);
      await onSendMessage(message);
      console.log("AI response received successfully");
    } catch (error) {
      console.error("Error processing message:", error);
      toast.error("Something went wrong. Please try again with a shorter message.");
    } finally {
      clearProcessingTimeout();
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    stopListening();
    cleanupAudio();
    clearProcessingTimeout();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voice Chat Mode</DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
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
          
          <div className="mb-6 h-12 flex items-center justify-center">
            {isListening && !aiSpeaking && (
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
            )}
            
            {aiSpeaking && (
              <div className="flex items-end space-x-1">
                {[...Array(20)].map((_, i) => {
                  const phase = Date.now() / 1000 * Math.PI * 2;
                  const height = 5 + Math.sin(phase + i / 3) * 15 + 15;
                  return (
                    <motion.div
                      key={i}
                      className="w-1 bg-primary/70 rounded-full"
                      animate={{ height }}
                      transition={{ duration: 0.1 }}
                    />
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="flex justify-center space-x-4">
            {isListening ? (
              <Button onClick={stopListening} variant="destructive" className="gap-2" disabled={isProcessing || aiSpeaking}>
                <StopCircle className="h-4 w-4" /> Stop Listening
              </Button>
            ) : (
              <Button onClick={startListening} variant="default" className="gap-2" disabled={isProcessing || aiSpeaking}>
                <Mic className="h-4 w-4" /> Start Listening
              </Button>
            )}
            
            <Button onClick={handleClose} variant="outline">
              <X className="h-4 w-4 mr-2" /> Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceChatModal;
