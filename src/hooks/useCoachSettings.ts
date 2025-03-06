
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface CoachSettings {
  coachStyle: string;
  coachTone: string;
  intensity?: number;
  morningTime?: string;
  eveningTime?: string;
}

export function useCoachSettings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const saveCoachSettings = async (settings: CoachSettings) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const updateData: any = {
        coach_style: settings.coachStyle,
        coach_tone: settings.coachTone
      };
      
      // Add optional fields if they exist
      if (settings.morningTime) updateData.morning_time = settings.morningTime;
      if (settings.eveningTime) updateData.evening_time = settings.eveningTime;
      if (settings.intensity) updateData.coach_intensity = settings.intensity;
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error saving coach settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCoachSettings = async () => {
    if (!user) return null;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('coach_style, coach_tone, morning_time, evening_time, coach_intensity')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error fetching coach settings:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveCoachSettings,
    getCoachSettings,
    isLoading
  };
}
