
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

interface UseVoiceRecordingOptions {
  onTranscriptChange?: (transcript: string) => void;
}

export function useVoiceRecording({ onTranscriptChange }: UseVoiceRecordingOptions = {}) {
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
        onTranscriptChange?.(transcriptValue);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          toast.error("Microphone access denied. Please allow microphone access to use voice input.");
        }
        setIsRecording(false);
      };
    } else {
      toast.error("Your browser doesn't support speech recognition. Please try a different browser.");
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [onTranscriptChange]);
  
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

  return {
    isRecording,
    transcript,
    amplitude,
    startRecording,
    stopRecording,
    setTranscript
  };
}
