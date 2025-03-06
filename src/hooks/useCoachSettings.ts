
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

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
    if (!user) {
      console.error("No user found when trying to save coach settings");
      toast.error("You must be logged in to save settings");
      return;
    }
    
    setIsLoading(true);
    console.log("Saving coach settings:", settings);
    
    try {
      const updateData: any = {
        coach_style: settings.coachStyle,
        coach_tone: settings.coachTone
      };
      
      // Add optional fields if they exist
      if (settings.morningTime) updateData.morning_time = settings.morningTime;
      if (settings.eveningTime) updateData.evening_time = settings.eveningTime;
      if (settings.intensity !== undefined) updateData.coach_intensity = settings.intensity;
      
      console.log("Update data being sent to Supabase:", updateData);
      
      const { error, data } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select();

      if (error) {
        console.error("Supabase error when saving settings:", error);
        toast.error("Failed to save coach settings: " + error.message);
        throw error;
      }
      
      console.log("Coach settings saved successfully:", data);
      toast.success("Coach settings saved successfully");
      return data;
    } catch (error: any) {
      console.error("Error saving coach settings:", error);
      toast.error(error.message || "Failed to save coach settings");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getCoachSettings = async () => {
    if (!user) {
      console.log("No user found when fetching coach settings");
      return null;
    }
    
    setIsLoading(true);
    try {
      console.log("Fetching coach settings for user:", user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('coach_style, coach_tone, morning_time, evening_time, coach_intensity')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching coach settings:", error);
        throw error;
      }
      
      console.log("Coach settings retrieved:", data);
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
