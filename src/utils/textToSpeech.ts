
/**
 * A utility for handling text-to-speech functionality using browser's SpeechSynthesis API
 */
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
  private audio: HTMLAudioElement | null = null;

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
    
    try {
      this.voices = this.speechSynthesis.getVoices();
      this.selectPreferredVoice();
    } catch (error) {
      console.error("Error loading voices:", error);
    }
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
    if (!this.preferredVoice && this.voices.length > 0) {
      this.preferredVoice = this.voices.find(voice => voice.lang.startsWith('en')) || this.voices[0];
    }
    
    console.log("Selected voice:", this.preferredVoice?.name || "No voice available");
  }

  public setVoicePreference(voiceName: string): void {
    this.voicePreference = voiceName;
    this.selectPreferredVoice();
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => voice.lang.startsWith('en'));
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
      this.speakWithBrowser(text, onEnd);
    } catch (error) {
      console.error('Error during text-to-speech:', error);
      toast.error("Failed to generate speech. Please try again.");
      this.isSpeaking = false;
      this.notifySpeakEnd();
      if (onEnd) onEnd();
    }
  }

  private handleAudioEnded: () => void = () => {};

  private speakWithBrowser(text: string, onEnd?: () => void): void {
    if (!this.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }
    
    try {
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
        toast.error("Speech synthesis failed. Please try again.");
        this.isSpeaking = false;
        this.notifySpeakEnd();
        if (onEnd) onEnd();
      };

      this.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error in browser speech synthesis:', error);
      toast.error("Failed to generate speech. Please try again.");
      this.isSpeaking = false;
      this.notifySpeakEnd();
      if (onEnd) onEnd();
    }
  }

  public cancel(): void {
    if (this.audio) {
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
