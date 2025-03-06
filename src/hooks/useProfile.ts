
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export function useProfile() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const updateProfile = async (profileData: any) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Error updating profile");
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProfile = async () => {
    if (!user) return null;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateProfile,
    getProfile,
    isLoading
  };
}
