
/**
 * TextToSpeech utility class
 * Provides text-to-speech functionality with fallback options
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Voice options for ElevenLabs
export type VoiceOption = {
  id: string;
  name: string;
};

const ELEVENLABS_VOICES: VoiceOption[] = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam" },
  { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam" },
];

class TextToSpeech {
  private static instance: TextToSpeech;
  private voiceId: string = "21m00Tcm4TlvDq8ikWAM"; // Rachel by default
  private enabled: boolean = true;
  private isSpeaking: boolean = false;
  private audioQueue: string[] = [];
  private isProcessingQueue: boolean = false;
  private audio: HTMLAudioElement | null = null;
  private speakStartCallbacks: (() => void)[] = [];
  private speakEndCallbacks: (() => void)[] = [];
  private useNativeFallback: boolean = false;
  private failedAttempts: number = 0;
  private maxFailedAttempts: number = 3;

  private constructor() {
    // Initialize audio element if in browser
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.audio.addEventListener('ended', this.handleAudioEnd.bind(this));
      this.audio.addEventListener('error', this.handleAudioError.bind(this));
    }
    
    // Load saved preferences
    this.loadPreferences();
  }

  public static getInstance(): TextToSpeech {
    if (!TextToSpeech.instance) {
      TextToSpeech.instance = new TextToSpeech();
    }
    return TextToSpeech.instance;
  }

  private loadPreferences(): void {
    if (typeof window !== 'undefined') {
      // Load voice preference from localStorage
      const savedVoiceId = localStorage.getItem('tts_voice_id');
      if (savedVoiceId) {
        this.voiceId = savedVoiceId;
      }
      
      // Load enabled status from localStorage
      const enabledStr = localStorage.getItem('tts_enabled');
      if (enabledStr !== null) {
        this.enabled = enabledStr === 'true';
      }
      
      // Load fallback preference
      const fallbackStr = localStorage.getItem('tts_use_native_fallback');
      if (fallbackStr !== null) {
        this.useNativeFallback = fallbackStr === 'true';
      }
    }
  }

  private savePreferences(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tts_voice_id', this.voiceId);
      localStorage.setItem('tts_enabled', String(this.enabled));
      localStorage.setItem('tts_use_native_fallback', String(this.useNativeFallback));
    }
  }

  public async speak(text: string, onComplete?: () => void): Promise<void> {
    if (!this.enabled || !text) return;
    
    // Add to queue
    this.audioQueue.push(text);
    
    // If callback provided, attach it to the last audio in the queue
    if (onComplete && this.speakEndCallbacks.length < this.audioQueue.length) {
      this.speakEndCallbacks.push(onComplete);
    }
    
    // Start processing the queue if not already doing so
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.audioQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    // Get the next text to speak
    const text = this.audioQueue[0];
    
    try {
      // Notify start
      this.isSpeaking = true;
      this.notifySpeakStart();
      
      // If we've had too many failed attempts or user prefers native, use browser TTS
      if (this.failedAttempts >= this.maxFailedAttempts || this.useNativeFallback) {
        await this.speakWithNative(text);
      } else {
        // Try with ElevenLabs
        await this.speakWithElevenLabs(text);
      }
    } catch (error) {
      console.error("TTS error:", error);
      this.failedAttempts++;
      
      // Switch to native TTS if too many failures
      if (this.failedAttempts >= this.maxFailedAttempts) {
        this.useNativeFallback = true;
        this.savePreferences();
        toast.error("Switched to browser's text-to-speech due to errors");
        
        // Try again with native
        try {
          await this.speakWithNative(text);
        } catch (nativeError) {
          console.error("Native TTS error:", nativeError);
          // Just remove from queue if even native fails
          this.audioQueue.shift();
          this.handleAudioEnd();
        }
      } else {
        // Just remove from queue
        this.audioQueue.shift();
        this.handleAudioEnd();
      }
    }
  }

  private async speakWithElevenLabs(text: string): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice: this.voiceId }
      });
      
      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      if (!data.audio) {
        throw new Error("No audio data returned");
      }
      
      // Set the audio source
      if (this.audio) {
        this.audio.src = `data:audio/mpeg;base64,${data.audio}`;
        this.audio.play();
      } else {
        throw new Error("Audio element not initialized");
      }
      
      // Reset failed attempts counter on success
      this.failedAttempts = 0;
      
    } catch (error) {
      console.error("ElevenLabs TTS error:", error);
      // Increment failed attempts and try native as fallback
      this.failedAttempts++;
      
      if (this.failedAttempts >= this.maxFailedAttempts) {
        toast.error("Switching to browser's text-to-speech due to errors");
        this.useNativeFallback = true;
        this.savePreferences();
      }
      
      throw error;
    }
  }

  private async speakWithNative(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error("Browser doesn't support speech synthesis"));
        return;
      }
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.onend = () => {
        this.audioQueue.shift();
        this.handleAudioEnd();
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error("SpeechSynthesis error:", event);
        this.audioQueue.shift();
        this.handleAudioEnd();
        reject(new Error("Speech synthesis error"));
      };
      
      window.speechSynthesis.speak(utterance);
    });
  }

  private handleAudioEnd(): void {
    // Remove the first item from the queue
    this.audioQueue.shift();
    
    // Execute the callback for this speech
    const callback = this.speakEndCallbacks.shift();
    if (callback) {
      callback();
    }
    
    // Notify that speaking has ended
    this.isSpeaking = false;
    this.notifySpeakEnd();
    
    // Check if more items in queue
    if (this.audioQueue.length > 0) {
      // Process next item
      this.processQueue();
    } else {
      this.isProcessingQueue = false;
    }
  }

  private handleAudioError(error: Event): void {
    console.error("Audio playback error:", error);
    this.failedAttempts++;
    
    // Fallback to native TTS if too many failures
    if (this.failedAttempts >= this.maxFailedAttempts) {
      this.useNativeFallback = true;
      this.savePreferences();
      toast.error("Switching to browser's text-to-speech due to errors");
    }
    
    // Continue with queue
    this.handleAudioEnd();
  }

  // Control methods
  public cancel(): void {
    // Stop current audio
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    
    // Cancel native speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Clear queue
    this.audioQueue = [];
    this.speakEndCallbacks = [];
    this.isSpeaking = false;
    this.isProcessingQueue = false;
    
    // Notify that speaking has ended
    this.notifySpeakEnd();
  }

  public toggleEnabled(): boolean {
    this.enabled = !this.enabled;
    
    if (!this.enabled) {
      this.cancel();
    }
    
    this.savePreferences();
    return this.enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // Voice selection methods
  public setVoicePreference(voiceId: string): void {
    this.voiceId = voiceId;
    this.savePreferences();
  }

  public getVoicePreference(): string {
    return this.voiceId;
  }

  public setElevenLabsVoice(voiceId: string): void {
    this.voiceId = voiceId;
    this.useNativeFallback = false;
    this.failedAttempts = 0;
    this.savePreferences();
  }

  public getElevenLabsVoices(): VoiceOption[] {
    return ELEVENLABS_VOICES;
  }

  public setUseNativeFallback(useNative: boolean): void {
    this.useNativeFallback = useNative;
    this.savePreferences();
  }

  // Event listeners for speech status
  public onSpeakStart(callback: () => void): void {
    this.speakStartCallbacks.push(callback);
  }

  public offSpeakStart(callback: () => void): void {
    this.speakStartCallbacks = this.speakStartCallbacks.filter(cb => cb !== callback);
  }

  public onSpeakEnd(callback: () => void): void {
    this.speakEndCallbacks.push(callback);
  }

  public offSpeakEnd(callback: () => void): void {
    this.speakEndCallbacks = this.speakEndCallbacks.filter(cb => cb !== callback);
  }

  private notifySpeakStart(): void {
    this.speakStartCallbacks.forEach(callback => callback());
  }

  private notifySpeakEnd(): void {
    this.speakEndCallbacks.forEach(callback => callback());
  }
}

export default TextToSpeech;
