
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Mic, StopCircle } from "lucide-react";
import { toast } from "sonner";
import TextToSpeech from "@/utils/textToSpeech";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useAudioVisualization } from "@/hooks/useAudioVisualization";
import AudioWaveform from "./AudioWaveform";
import TranscriptDisplay from "./TranscriptDisplay";

interface VoiceChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => Promise<void>;
}

const VoiceChatModal = ({ isOpen, onClose, onSendMessage }: VoiceChatModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const tts = useRef(TextToSpeech.getInstance());
  
  // Speech recognition hook
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    setTranscript 
  } = useSpeechRecognition({
    speaking: aiSpeaking
  });
  
  // Audio visualization hook
  const { amplitude, cleanupAudio } = useAudioVisualization(isListening);
  
  // Set up TTS listeners
  useEffect(() => {
    if (isOpen) {
      // Set up TTS listeners
      tts.current.onSpeakStart(() => setAiSpeaking(true));
      tts.current.onSpeakEnd(() => setAiSpeaking(false));
      
      // Auto-start listening when modal opens
      startListening();
    }
    
    return () => {
      // Clean up TTS listeners
      const ttsInstance = tts.current;
      ttsInstance.offSpeakStart(() => setAiSpeaking(true));
      ttsInstance.offSpeakEnd(() => setAiSpeaking(false));
    };
  }, [isOpen, startListening]);
  
  // Monitor transcript and auto-submit after a pause in speech
  useEffect(() => {
    if (!transcript || isProcessing || aiSpeaking) return;
    
    const timer = setTimeout(() => {
      if (transcript.trim() && isListening) {
        sendTranscriptToAI();
      }
    }, 1500); // 1.5 second pause triggers send
    
    return () => clearTimeout(timer);
  }, [transcript, isListening, isProcessing, aiSpeaking]);

  const sendTranscriptToAI = async () => {
    if (!transcript.trim() || isProcessing) return;
    
    // Store and clear transcript
    const message = transcript;
    setTranscript("");
    setIsProcessing(true);
    
    try {
      // Process the message and get AI response
      await onSendMessage(message);
    } catch (error) {
      console.error("Error processing message:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    stopListening();
    cleanupAudio();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voice Chat Mode</DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          <TranscriptDisplay
            transcript={transcript}
            isProcessing={isProcessing}
            aiSpeaking={aiSpeaking}
            isListening={isListening}
          />
          
          <div className="mb-6 h-12 flex items-center justify-center">
            {isListening && !aiSpeaking && (
              <AudioWaveform amplitude={amplitude} />
            )}
            
            {aiSpeaking && (
              <AudioWaveform amplitude={0} isAiSpeaking={true} />
            )}
          </div>
          
          <div className="flex justify-center space-x-4">
            {isListening ? (
              <Button 
                onClick={stopListening} 
                variant="destructive" 
                className="gap-2" 
                disabled={isProcessing || aiSpeaking}
              >
                <StopCircle className="h-4 w-4" /> Stop Listening
              </Button>
            ) : (
              <Button 
                onClick={startListening} 
                variant="default" 
                className="gap-2" 
                disabled={isProcessing || aiSpeaking}
              >
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
