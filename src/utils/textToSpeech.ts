
/**
 * A utility for handling text-to-speech functionality
 */
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

class TextToSpeech {
  private static instance: TextToSpeech;
  private speechSynthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isSpeaking: boolean = false;
  private preferredVoice: SpeechSynthesisVoice | null = null;
  private enabled: boolean = true;
  private onSpeakStartCallbacks: Array<() => void> = [];
  private onSpeakEndCallbacks: Array<() => void> = [];
  private voicePreference: string | null = null;
  private useEdgeFunction: boolean = true;
  private audio: HTMLAudioElement | null = null;
  private openAIVoice: string = "alloy"; // Default OpenAI voice

  private constructor() {
    if (typeof window !== 'undefined') {
      this.speechSynthesis = window.speechSynthesis;
      this.loadVoices();

      // Handle voiceschanged event for browsers that load voices asynchronously
      if (this.speechSynthesis && this.speechSynthesis.onvoiceschanged !== undefined) {
        this.speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
      }
    }
  }

  public static getInstance(): TextToSpeech {
    if (!TextToSpeech.instance) {
      TextToSpeech.instance = new TextToSpeech();
    }
    return TextToSpeech.instance;
  }

  private loadVoices(): void {
    if (!this.speechSynthesis) return;
    
    this.voices = this.speechSynthesis.getVoices();
    this.selectPreferredVoice();
  }

  private selectPreferredVoice(): void {
    if (!this.speechSynthesis) return;
    
    // Try to select a preferred English voice based on user preference or defaults
    let preferVoiceNames = ['Samantha', 'Google UK English Female', 'Microsoft Zira', 'Female'];
    
    // If user has a specific voice preference, prioritize it
    if (this.voicePreference) {
      preferVoiceNames.unshift(this.voicePreference);
    }
    
    // Try to find a voice that matches the user's preference
    for (const name of preferVoiceNames) {
      const foundVoice = this.voices.find(voice => 
        voice.name.includes(name) && voice.lang.startsWith('en')
      );
      if (foundVoice) {
        this.preferredVoice = foundVoice;
        break;
      }
    }
    
    // Fallback to the first English voice if no preferred voice is found
    if (!this.preferredVoice) {
      this.preferredVoice = this.voices.find(voice => voice.lang.startsWith('en')) || null;
    }
  }

  public setVoicePreference(voiceName: string): void {
    this.voicePreference = voiceName;
    this.selectPreferredVoice();
  }

  public setOpenAIVoice(voice: string): void {
    this.openAIVoice = voice;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => voice.lang.startsWith('en'));
  }

  public getOpenAIVoices(): string[] {
    return ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
  }

  public async speak(text: string, onEnd?: () => void): Promise<void> {
    if (!this.enabled || !text) {
      if (onEnd) onEnd();
      return;
    }

    // Cancel any ongoing speech
    this.cancel();
    
    this.isSpeaking = true;
    this.notifySpeakStart();

    try {
      if (this.useEdgeFunction) {
        await this.speakWithEdgeFunction(text, onEnd);
      } else {
        this.speakWithBrowser(text, onEnd);
      }
    } catch (error) {
      console.error('Error during text-to-speech:', error);
      this.isSpeaking = false;
      this.notifySpeakEnd();
      if (onEnd) onEnd();
      
      // Fallback to browser TTS if edge function fails
      if (this.useEdgeFunction) {
        console.log('Falling back to browser TTS');
        this.useEdgeFunction = false;
        this.speakWithBrowser(text, onEnd);
      }
    }
  }

  private async speakWithEdgeFunction(text: string, onEnd?: () => void): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke("text-to-speech", {
        body: { 
          text: text,
          voice: this.openAIVoice
        }
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw error;
      }

      if (data && data.audio) {
        // Create audio from base64
        const audioSrc = `data:audio/mp3;base64,${data.audio}`;
        
        if (this.audio) {
          this.audio.pause();
          this.audio.removeEventListener('ended', this.handleAudioEnded);
        }
        
        this.audio = new Audio(audioSrc);
        
        this.handleAudioEnded = () => {
          this.isSpeaking = false;
          this.notifySpeakEnd();
          if (onEnd) onEnd();
          this.audio?.removeEventListener('ended', this.handleAudioEnded);
        };
        
        this.audio.addEventListener('ended', this.handleAudioEnded);
        await this.audio.play();
      } else {
        throw new Error("No audio data received");
      }
    } catch (error: any) {
      console.error("Text-to-speech error:", error);
      toast.error("Failed to generate speech: " + (error.message || "Unknown error"));
      
      // Fall back to browser TTS
      this.useEdgeFunction = false;
      this.speakWithBrowser(text, onEnd);
    }
  }

  private handleAudioEnded: () => void = () => {};

  private speakWithBrowser(text: string, onEnd?: () => void): void {
    if (!this.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onend = () => {
      this.isSpeaking = false;
      this.notifySpeakEnd();
      if (onEnd) onEnd();
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.isSpeaking = false;
      this.notifySpeakEnd();
      if (onEnd) onEnd();
    };

    this.speechSynthesis.speak(utterance);
  }

  public cancel(): void {
    if (this.useEdgeFunction && this.audio) {
      this.audio.pause();
      this.audio.removeEventListener('ended', this.handleAudioEnded);
      this.audio = null;
    } else if (this.speechSynthesis && this.speechSynthesis.speaking) {
      this.speechSynthesis.cancel();
    }
    
    if (this.isSpeaking) {
      this.isSpeaking = false;
      this.notifySpeakEnd();
    }
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.cancel();
    }
  }

  public getEnabled(): boolean {
    return this.enabled;
  }

  public toggleEnabled(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  public onSpeakStart(callback: () => void): void {
    this.onSpeakStartCallbacks.push(callback);
  }

  public onSpeakEnd(callback: () => void): void {
    this.onSpeakEndCallbacks.push(callback);
  }

  public offSpeakStart(callback: () => void): void {
    this.onSpeakStartCallbacks = this.onSpeakStartCallbacks.filter(cb => cb !== callback);
  }

  public offSpeakEnd(callback: () => void): void {
    this.onSpeakEndCallbacks = this.onSpeakEndCallbacks.filter(cb => cb !== callback);
  }

  private notifySpeakStart(): void {
    this.onSpeakStartCallbacks.forEach(callback => callback());
  }

  private notifySpeakEnd(): void {
    this.onSpeakEndCallbacks.forEach(callback => callback());
  }
}

export default TextToSpeech;
