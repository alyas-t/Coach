
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone. Please check your permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];
          
          console.log("Sending audio to voice-to-text function");
          
          // Call the Supabase Edge Function
          const { data, error } = await supabase.functions.invoke("voice-to-text", {
            body: { audio: base64Audio }
          });
          
          if (error) {
            console.error("Supabase function error:", error);
            throw error;
          }
          
          console.log("Received transcription response:", data);
          
          if (data && data.text) {
            onTranscription(data.text);
            toast.success("Voice transcribed successfully");
          } else {
            toast.error("No transcription received");
          }
        } catch (error: any) {
          console.error("Transcription error:", error);
          toast.error("Failed to transcribe audio: " + (error.message || "Unknown error"));
        } finally {
          setIsTranscribing(false);
        }
      };
      
      reader.readAsDataURL(audioBlob);
    } catch (error: any) {
      console.error("Error processing audio:", error);
      toast.error("Failed to process audio: " + (error.message || "Unknown error"));
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
