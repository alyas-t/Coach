
// A singleton class to handle text-to-speech functionality
export default class TextToSpeech {
  private static instance: TextToSpeech;
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[];
  private isEnabled: boolean = true;
  private isProcessing: boolean = false;
  private utteranceQueue: SpeechSynthesisUtterance[] = [];
  private preferredVoice: string = "21m00Tcm4TlvDq8ikWAM"; // Default ElevenLabs voice ID (Rachel)
  private elevenLabsVoices: any[] = [
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel - Friendly" },
    { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi - Friendly" },
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella - Professional" },
    { id: "ErXwobaYiN019PkySvjV", name: "Antoni - Warm" },
    { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli - Professional" },
    { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh - Encouraging" },
    { id: "VR6AewLTigWG4xSOukaG", name: "Arnold - Motivational" },
    { id: "pNInz6obpgDQGcFmaJgB", name: "Adam - Inspirational" },
    { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam - Friendly" }
  ];
  
  // Event handlers for speech start and end
  private speakStartListeners: (() => void)[] = [];
  private speakEndListeners: (() => void)[] = [];

  private constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.loadVoices();
    
    // Set up the voice changed event listener
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
    }
    
    // Handle queue processing
    this.setupUtteranceEvents = this.setupUtteranceEvents.bind(this);
    this.processQueue = this.processQueue.bind(this);
  }

  public static getInstance(): TextToSpeech {
    if (!TextToSpeech.instance) {
      TextToSpeech.instance = new TextToSpeech();
    }
    return TextToSpeech.instance;
  }

  private loadVoices(): void {
    this.voices = this.synth.getVoices();
  }
  
  private setupUtteranceEvents(utterance: SpeechSynthesisUtterance): void {
    utterance.onstart = () => {
      // Notify all listeners that speech has started
      this.speakStartListeners.forEach(listener => listener());
    };
    
    utterance.onend = () => {
      // Notify all listeners that speech has ended
      this.speakEndListeners.forEach(listener => listener());
      
      this.isProcessing = false;
      setTimeout(() => this.processQueue(), 100);
    };
    
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      // Notify all listeners that speech has ended due to error
      this.speakEndListeners.forEach(listener => listener());
      
      this.isProcessing = false;
      setTimeout(() => this.processQueue(), 100);
    };
  }
  
  private processQueue(): void {
    if (this.utteranceQueue.length === 0 || this.isProcessing) {
      return;
    }
    
    this.isProcessing = true;
    const utterance = this.utteranceQueue.shift();
    
    if (utterance) {
      try {
        this.synth.speak(utterance);
      } catch (error) {
        console.error("Error speaking:", error);
        this.isProcessing = false;
        setTimeout(() => this.processQueue(), 100);
      }
    } else {
      this.isProcessing = false;
    }
  }

  // Add callback for when speech starts
  public onSpeakStart(callback: () => void): void {
    this.speakStartListeners.push(callback);
  }
  
  // Add callback for when speech ends
  public onSpeakEnd(callback: () => void): void {
    this.speakEndListeners.push(callback);
  }
  
  // Remove callback for when speech starts
  public offSpeakStart(callback: () => void): void {
    this.speakStartListeners = this.speakStartListeners.filter(
      listener => listener !== callback
    );
  }
  
  // Remove callback for when speech ends
  public offSpeakEnd(callback: () => void): void {
    this.speakEndListeners = this.speakEndListeners.filter(
      listener => listener !== callback
    );
  }

  public speak(text: string, callback?: () => void): void {
    if (!this.isEnabled) return;
    
    try {
      // Cancel any ongoing speech first
      this.cancel();
      
      // Create a new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Select a voice - preferably a female voice
      let selectedVoice = this.voices.find(voice => voice.name.includes('Female') || voice.name.includes('female'));
      
      // Fallback to any available voice if no female voice is found
      if (!selectedVoice && this.voices.length > 0) {
        selectedVoice = this.voices[0];
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      // Set other properties
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Set up event handlers
      this.setupUtteranceEvents(utterance);
      
      // If a callback was provided, add it as an onend listener
      if (callback) {
        utterance.onend = (event) => {
          // First call the regular onend handler
          this.speakEndListeners.forEach(listener => listener());
          this.isProcessing = false;
          
          // Then call the provided callback
          callback();
          
          // Resume queue processing
          setTimeout(() => this.processQueue(), 100);
        };
      }
      
      // Add to queue
      this.utteranceQueue.push(utterance);
      
      // Process queue if not already processing
      if (!this.isProcessing) {
        this.processQueue();
      }
    } catch (error) {
      console.error("Error in speak function:", error);
      if (callback) callback();
    }
  }

  public cancel(): void {
    try {
      this.synth.cancel();
      this.utteranceQueue = [];
      this.isProcessing = false;
    } catch (error) {
      console.error("Error cancelling speech:", error);
    }
  }

  public toggleEnabled(): boolean {
    this.isEnabled = !this.isEnabled;
    if (!this.isEnabled) {
      this.cancel();
    }
    return this.isEnabled;
  }
  
  public isEnabledStatus(): boolean {
    return this.isEnabled;
  }
  
  // Return whether TTS is enabled (alias for isEnabledStatus for compatibility)
  public getEnabled(): boolean {
    return this.isEnabled;
  }
  
  // Get available browser voices
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }
  
  public getElevenLabsVoices(): any[] {
    return this.elevenLabsVoices;
  }
  
  public setVoicePreference(voiceId: string): void {
    this.preferredVoice = voiceId;
    
    // Save to localStorage for persistence
    try {
      localStorage.setItem('preferred_voice', voiceId);
    } catch (error) {
      console.error('Error saving voice preference:', error);
    }
  }
  
  public getPreferredVoice(): string {
    // Try to get from localStorage first
    try {
      const savedVoice = localStorage.getItem('preferred_voice');
      if (savedVoice) {
        this.preferredVoice = savedVoice;
      }
    } catch (error) {
      console.error('Error getting voice preference:', error);
    }
    
    return this.preferredVoice;
  }
}
