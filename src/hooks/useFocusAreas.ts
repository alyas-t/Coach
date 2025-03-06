
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export function useFocusAreas() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const saveFocusAreas = async (focusAreas: string[]) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // First delete existing focus areas
      await supabase
        .from('focus_areas')
        .delete()
        .eq('user_id', user.id);

      // Then insert new ones
      const focusAreasData = focusAreas.map(name => ({
        user_id: user.id,
        name
      }));

      const { error } = await supabase
        .from('focus_areas')
        .insert(focusAreasData);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error saving focus areas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFocusAreas = async () => {
    if (!user) return [];
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('focus_areas')
        .select('name')
        .eq('user_id', user.id);

      if (error) throw error;
      return data.map(item => item.name);
    } catch (error: any) {
      console.error("Error fetching focus areas:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveFocusAreas,
    getFocusAreas,
    isLoading
  };
}
