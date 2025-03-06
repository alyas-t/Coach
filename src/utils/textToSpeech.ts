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
  private onSpeakStartCallbacks: Array<() => void> = [];
  private onSpeakEndCallbacks: Array<() => void> = [];
  private voicePreference: string | null = null;
  private voiceCharacteristics: {
    gender?: 'male' | 'female';
    style?: 'supportive' | 'motivational' | 'professional';
  } = {};

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
    this.selectPreferredVoice();
  }

  private selectPreferredVoice(): void {
    // Try to select a preferred English voice based on user preference or defaults
    let preferVoiceNames: string[] = [];
    
    // If user has a specific voice preference, prioritize it
    if (this.voicePreference) {
      preferVoiceNames.push(this.voicePreference);
    } else {
      // Otherwise use characteristics to select an appropriate voice
      if (this.voiceCharacteristics.style === 'supportive') {
        preferVoiceNames = this.voiceCharacteristics.gender === 'male' 
          ? ['Google UK English Male', 'Microsoft David'] 
          : ['Samantha', 'Google UK English Female', 'Microsoft Zira'];
      } else if (this.voiceCharacteristics.style === 'motivational') {
        preferVoiceNames = this.voiceCharacteristics.gender === 'male'
          ? ['Alex', 'Microsoft David', 'Google US English']
          : ['Karen', 'Victoria', 'Google US English Female'];
      } else if (this.voiceCharacteristics.style === 'professional') {
        preferVoiceNames = this.voiceCharacteristics.gender === 'male'
          ? ['Daniel', 'Google UK English Male']
          : ['Moira', 'Google UK English Female'];
      } else {
        // Default voice preferences
        preferVoiceNames = ['Samantha', 'Google UK English Female', 'Microsoft Zira', 'Female'];
      }
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

  public setVoiceCharacteristics(characteristics: {
    gender?: 'male' | 'female';
    style?: 'supportive' | 'motivational' | 'professional';
  }): void {
    this.voiceCharacteristics = {
      ...this.voiceCharacteristics,
      ...characteristics
    };
    this.selectPreferredVoice();
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => voice.lang.startsWith('en'));
  }

  public speak(text: string, onEnd?: () => void): void {
    if (!this.enabled || !text || this.speechSynthesis.speaking) {
      if (onEnd) onEnd();
      return;
    }

    this.isSpeaking = true;
    this.notifySpeakStart();

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice;
    }
    
    // Adjust rate based on voice style
    if (this.voiceCharacteristics.style === 'motivational') {
      utterance.rate = 1.1; // Slightly faster for motivational
      utterance.pitch = 1.1; // Slightly higher pitch
    } else if (this.voiceCharacteristics.style === 'professional') {
      utterance.rate = 0.95; // Slightly slower for professional
      utterance.pitch = 0.95; // Slightly lower pitch
    } else {
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
    }
    
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
    if (this.speechSynthesis.speaking) {
      this.speechSynthesis.cancel();
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
