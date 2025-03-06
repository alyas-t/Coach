
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

export function useAudioVisualization(isActive: boolean) {
  const [amplitude, setAmplitude] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  // Set up audio visualization
  useEffect(() => {
    if (isActive) {
      setupAudioVisualization();
    }
    
    return () => cleanupAudio();
  }, [isActive]);
  
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
        if (analyserRef.current && isActive) {
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

  return {
    amplitude,
    cleanupAudio
  };
}
