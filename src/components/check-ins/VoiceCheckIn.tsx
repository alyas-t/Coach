
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface VoiceCheckInProps {
  onTranscription: (text: string) => void;
}

const VoiceCheckIn = ({ onTranscription }: VoiceCheckInProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks((chunks) => [...chunks, e.data]);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          
          try {
            const { data, error } = await supabase.functions.invoke('voice-to-text', {
              body: { audio: base64Audio }
            });
            
            if (error) throw error;
            onTranscription(data.text);
            
          } catch (error) {
            console.error('Error transcribing audio:', error);
            toast.error("Failed to transcribe audio");
          }
        };
        
        reader.readAsDataURL(audioBlob);
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
      setAudioChunks([]);
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <Button
      variant={isRecording ? "destructive" : "outline"}
      size="icon"
      onClick={isRecording ? stopRecording : startRecording}
      className="rounded-full h-12 w-12"
    >
      {isRecording ? (
        <MicOff className="h-6 w-6" />
      ) : (
        <Mic className="h-6 w-6" />
      )}
    </Button>
  );
};

export default VoiceCheckIn;
