
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useFocusAreas } from "@/hooks/useFocusAreas";

export interface Message {
  id: string;
  content: string;
  sender: "user" | "coach";
  timestamp: Date;
}

export function useChatMessages() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { getProfile } = useProfile();
  const { getFocusAreas } = useFocusAreas();

  const getMessages = async (date?: string) => {
    if (!user) return [];
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id);
      
      // If date is provided, filter by that date
      if (date) {
        const startOfDay = new Date(date);
        const endOfDay = new Date(date);
        endOfDay.setDate(endOfDay.getDate() + 1);
        
        query = query
          .gte('created_at', startOfDay.toISOString())
          .lt('created_at', endOfDay.toISOString());
      } else {
        // Default to today's messages
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        query = query.gte('created_at', today.toISOString());
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;
      
      return data.map((message: any) => ({
        id: message.id,
        content: message.content,
        sender: message.sender as "user" | "coach",
        timestamp: new Date(message.created_at)
      }));
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string, sender: "user" | "coach") => {
    if (!user) return null;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          content,
          sender
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        content: data.content,
        sender: data.sender as "user" | "coach",
        timestamp: new Date(data.created_at)
      };
    } catch (error: any) {
      console.error("Error sending message:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const generateCoachResponse = async (userMessage: string, messageHistory: Message[]) => {
    if (!user) return "I'm sorry, but you need to be logged in to chat with me.";
    
    try {
      // Get user profile and focus areas for context
      const profile = await getProfile();
      const focusAreas = await getFocusAreas();
      
      const userContext = {
        profile: {
          ...profile,
          focus_areas: focusAreas
        },
        messages: messageHistory.slice(-10) // Send the last 10 messages for context
      };
      
      console.log("Generating response with context:", userContext);
      
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { message: userMessage, userContext }
      });
      
      if (error) throw error;
      
      return data.response;
    } catch (error) {
      console.error("Error generating coach response:", error);
      return "I'm having trouble connecting right now. Please try again later.";
    }
  };

  const clearTodaysMessages = async () => {
    if (!user) return false;
    
    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if there are any messages today
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());
        
      if (error) throw error;
      
      // If there are messages today, confirm they exist but don't delete them
      // We'll just start fresh with new messages
      console.log(`Found ${data.length} messages for today`);
      
      return true;
    } catch (error) {
      console.error("Error checking today's messages:", error);
      return false;
    }
  };

  const getChatDays = async () => {
    if (!user) return [];
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Extract unique dates
      const uniqueDates = new Set();
      data.forEach(message => {
        const date = new Date(message.created_at).toISOString().split('T')[0];
        uniqueDates.add(date);
      });
      
      return Array.from(uniqueDates);
    } catch (error) {
      console.error("Error fetching chat days:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getMessages,
    sendMessage,
    generateCoachResponse,
    clearTodaysMessages,
    getChatDays,
    isLoading
  };
}
