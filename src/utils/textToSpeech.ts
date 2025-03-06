
/**
 * A utility for handling text-to-speech functionality using ElevenLabs API
 */
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

class TextToSpeech {
  private static instance: TextToSpeech;
  private speechSynthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private availableElevenLabsVoices: any[] = [];
  private isSpeaking: boolean = false;
  private preferredVoice: SpeechSynthesisVoice | null = null;
  private elevenLabsVoiceId: string | null = null;
  private enabled: boolean = true;
  private onSpeakStartCallbacks: Array<() => void> = [];
  private onSpeakEndCallbacks: Array<() => void> = [];
  private voicePreference: string | null = null;
  private audio: HTMLAudioElement | null = null;
  private useElevenLabs: boolean = true;
  private isProcessing: boolean = false; // Flag to prevent multiple simultaneous speak requests

  private constructor() {
    if (typeof window !== 'undefined') {
      this.speechSynthesis = window.speechSynthesis;
      this.loadVoices();

      // Handle voiceschanged event for browsers that load voices asynchronously
      if (this.speechSynthesis && this.speechSynthesis.onvoiceschanged !== undefined) {
        this.speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
      }
      
      // Set default ElevenLabs voice
      this.elevenLabsVoiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel voice
      
      // Load available ElevenLabs voices
      this.loadElevenLabsVoices();
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

  private async loadElevenLabsVoices(): Promise<void> {
    try {
      // For now, let's use a hard-coded list of popular ElevenLabs voices
      this.availableElevenLabsVoices = [
        { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel (Female)" },
        { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi (Female)" },
        { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah (Female)" },
        { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli (Female)" },
        { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh (Male)" },
        { id: "VR6AewLTigWG4xSOukaG", name: "Arnold (Male)" },
        { id: "pNInz6obpgDQGcFmaJgB", name: "Adam (Male)" },
        { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam (Male)" }
      ];
      
      console.log("Loaded ElevenLabs voices:", this.availableElevenLabsVoices);
    } catch (error) {
      console.error("Error loading ElevenLabs voices:", error);
      toast.error("Failed to load voice options");
    }
  }

  public setVoicePreference(voiceNameOrId: string): void {
    this.voicePreference = voiceNameOrId;
    
    // Check if it's an ElevenLabs voice ID
    const elevenLabsVoice = this.availableElevenLabsVoices.find(voice => voice.id === voiceNameOrId);
    if (elevenLabsVoice) {
      this.elevenLabsVoiceId = voiceNameOrId;
      this.useElevenLabs = true;
    } else {
      // Otherwise try to set it as a browser voice
      this.selectPreferredVoice();
      this.useElevenLabs = false;
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => voice.lang.startsWith('en'));
  }
  
  public getElevenLabsVoices(): any[] {
    return this.availableElevenLabsVoices;
  }

  public async speak(text: string, onEnd?: () => void): Promise<void> {
    // If speech is disabled or text is empty, do nothing
    if (!this.enabled || !text || this.isProcessing) {
      if (onEnd) onEnd();
      return;
    }

    // Set processing flag to prevent multiple speak requests
    this.isProcessing = true;

    // Cancel any ongoing speech
    this.cancel();
    
    this.isSpeaking = true;
    this.notifySpeakStart();

    try {
      if (this.useElevenLabs) {
        await this.speakWithElevenLabs(text, onEnd);
      } else {
        this.speakWithBrowser(text, onEnd);
      }
    } catch (error) {
      console.error('Error during text-to-speech:', error);
      toast.error("Failed to generate speech. Falling back to browser TTS.");
      this.speakWithBrowser(text, onEnd);
    } finally {
      // Reset processing flag when speak operation is complete or when it fails
      setTimeout(() => {
        this.isProcessing = false;
      }, 500); // Small delay to prevent rapid successive calls
    }
  }

  private async speakWithElevenLabs(text: string, onEnd?: () => void): Promise<void> {
    try {
      console.log("Using ElevenLabs for TTS with voice:", this.elevenLabsVoiceId);
      
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: {
          text: text,
          voiceId: this.elevenLabsVoiceId,
          model: "eleven_turbo_v2"
        }
      });
      
      if (error) {
        console.error("ElevenLabs TTS error:", error);
        throw error;
      }
      
      if (!data || !data.audioContent) {
        throw new Error("Invalid response from ElevenLabs TTS");
      }
      
      // Create audio element and play the speech
      this.audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      
      // Handle audio events
      this.handleAudioEnded = () => {
        this.isSpeaking = false;
        this.notifySpeakEnd();
        if (onEnd) onEnd();
      };
      
      this.audio.addEventListener('ended', this.handleAudioEnded);
      this.audio.addEventListener('error', (e) => {
        console.error("Audio playback error:", e);
        this.isSpeaking = false;
        this.notifySpeakEnd();
        if (onEnd) onEnd();
      });
      
      // Start playback
      await this.audio.play();
      
    } catch (error) {
      console.error("Error using ElevenLabs TTS:", error);
      this.isSpeaking = false;
      this.notifySpeakEnd();
      if (onEnd) onEnd();
      throw error;
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

  public toggleElevenLabsUsage(useElevenLabs: boolean): void {
    this.useElevenLabs = useElevenLabs;
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
