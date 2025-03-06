
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
      return null;
    }
    
    setIsLoading(true);
    console.log("Saving coach settings:", settings);
    
    try {
      // Create the update data with snake_case for the database
      const updateData = {
        coach_style: settings.coachStyle,
        coach_tone: settings.coachTone,
        coach_intensity: settings.intensity !== undefined ? settings.intensity : 3,
        morning_time: settings.morningTime || null,
        evening_time: settings.eveningTime || null
      };
      
      console.log("Update data being sent to Supabase:", updateData);
      
      const { error, data } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error("Supabase error when saving settings:", error);
        toast.error("Failed to save coach settings: " + error.message);
        return null;
      }
      
      console.log("Coach settings saved successfully:", data);
      toast.success("Coach settings saved successfully");
      return data;
    } catch (error: any) {
      console.error("Error saving coach settings:", error);
      toast.error(error.message || "Failed to save coach settings");
      return null;
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
        .single();

      if (error) {
        console.error("Error fetching coach settings:", error);
        return null;
      }
      
      console.log("Coach settings retrieved:", data);
      // Ensure we transform snake_case DB fields to camelCase for frontend
      return {
        coachStyle: data.coach_style || "supportive",
        coachTone: data.coach_tone || "friendly",
        morningTime: data.morning_time || "08:00",
        eveningTime: data.evening_time || "20:00",
        intensity: data.coach_intensity || 3
      };
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
