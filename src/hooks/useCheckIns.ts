
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface CheckIn {
  id: string;
  question: string;
  response?: string;
  check_in_date: string;
  completed: boolean;
  created_at: string;
}

export function useCheckIns() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const getCheckIns = async (date?: string) => {
    if (!user) return [];
    
    setIsLoading(true);
    try {
      // Use today's date if not provided
      const checkInDate = date || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', user.id)
        .eq('check_in_date', checkInDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error fetching check-ins:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const respondToCheckIn = async (checkInId: string, response: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('check_ins')
        .update({
          response,
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', checkInId);

      if (error) throw error;
      toast.success("Check-in response saved");
      return true;
    } catch (error: any) {
      console.error("Error responding to check-in:", error);
      toast.error("Error saving your response");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const triggerManualCheckIn = async (type: "morning" | "evening" = "morning") => {
    setIsLoading(true);
    try {
      // Use the Supabase instance's URL
      const url = `${supabase.supabaseUrl}/functions/v1/daily-check-in`;
      
      // Get the current session
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ type })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const result = await response.json();
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} check-in triggered successfully`);
      return result;
    } catch (error: any) {
      console.error("Error triggering check-in:", error);
      toast.error("Failed to trigger check-in");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getCheckIns,
    respondToCheckIn,
    triggerManualCheckIn,
    isLoading
  };
}
