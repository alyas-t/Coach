
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useFocusAreas } from "@/hooks/useFocusAreas";
import { useCoachSettings } from "@/hooks/useCoachSettings";
import TextToSpeech from "@/utils/textToSpeech";

export function useUserPreferences() {
  const { user } = useAuth();
  const { getProfile } = useProfile();
  const { getFocusAreas } = useFocusAreas();
  const { getCoachSettings } = useCoachSettings();
  
  const [preferences, setPreferences] = useState({
    name: "",
    age: null,
    focusAreas: [] as string[],
    coachStyle: "supportive",
    coachTone: "friendly",
    voiceEnabled: true,
    loaded: false
  });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUserPreferences() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // Load profile data
        const profile = await getProfile();
        const focusAreas = await getFocusAreas();
        const coachSettings = await getCoachSettings();
        
        // Set voice based on coach personality
        const textToSpeech = TextToSpeech.getInstance();
        
        // Select voice based on personality
        // This is a simple mapping - in a production app you might want more sophisticated matching
        if (coachSettings?.coachTone === 'friendly') {
          textToSpeech.setVoicePreference('Samantha');
        } else if (coachSettings?.coachTone === 'professional') {
          textToSpeech.setVoicePreference('Google UK English Male');
        } else if (coachSettings?.coachTone === 'motivational') {
          textToSpeech.setVoicePreference('Microsoft David');
        }
        
        setPreferences({
          name: profile?.name || "",
          age: profile?.age || null,
          focusAreas: focusAreas || [],
          coachStyle: coachSettings?.coachStyle || "supportive",
          coachTone: coachSettings?.coachTone || "friendly",
          voiceEnabled: textToSpeech.isEnabled(),
          loaded: true
        });
      } catch (error) {
        console.error("Error loading user preferences:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUserPreferences();
  }, [user]);
  
  const toggleVoice = () => {
    const textToSpeech = TextToSpeech.getInstance();
    const enabled = textToSpeech.toggleEnabled();
    setPreferences(prev => ({ ...prev, voiceEnabled: enabled }));
    return enabled;
  };
  
  return {
    preferences,
    isLoading,
    toggleVoice
  };
}
