
/**
 * A utility for handling text-to-speech functionality
 */
class TextToSpeech {
  private static instance: TextToSpeech;
  private speechSynthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private isSpeaking: boolean = false;
  private preferredVoice: SpeechSynthesisVoice | null = null;
  private enabled: boolean = true;

  private constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.loadVoices();

    // Handle voiceschanged event for browsers that load voices asynchronously
    if (this.speechSynthesis.onvoiceschanged !== undefined) {
      this.speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
    }
  }

  public static getInstance(): TextToSpeech {
    if (!TextToSpeech.instance) {
      TextToSpeech.instance = new TextToSpeech();
    }
    return TextToSpeech.instance;
  }

  private loadVoices(): void {
    this.voices = this.speechSynthesis.getVoices();
    
    // Try to select a preferred English female voice
    const preferVoiceNames = ['Samantha', 'Google UK English Female', 'Microsoft Zira', 'Female'];
    
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

  public speak(text: string, onEnd?: () => void): void {
    if (!this.enabled || !text || this.speechSynthesis.speaking) {
      if (onEnd) onEnd();
      return;
    }

    this.isSpeaking = true;

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.speechSynthesis.speak(utterance);
  }

  public cancel(): void {
    if (this.speechSynthesis.speaking) {
      this.speechSynthesis.cancel();
      this.isSpeaking = false;
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
}

export default TextToSpeech;
