
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
      
      if (date) {
        const startOfDay = new Date(date);
        const endOfDay = new Date(date);
        endOfDay.setDate(endOfDay.getDate() + 1);
        
        query = query
          .gte('created_at', startOfDay.toISOString())
          .lt('created_at', endOfDay.toISOString());
      } else {
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
      const profile = await getProfile();
      const focusAreas = await getFocusAreas();
      
      const userContext = {
        profile: {
          ...profile,
          focus_areas: focusAreas
        },
        messages: messageHistory.slice(-5) // Reduced from 10 to 5 for faster responses
      };
      
      console.log("Generating response with context:", JSON.stringify(userContext, null, 2));
      
      // Set a shorter timeout for faster error recovery 
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI response timed out')), 20000); // 20 seconds timeout
      });
      
      try {
        // Race between the Supabase function call and the timeout
        const responsePromise = supabase.functions.invoke('gemini-chat', {
          body: { 
            message: userMessage, 
            userContext,
            max_tokens: 600 // Limit token count for faster response
          }
        });
        
        const result = await Promise.race([responsePromise, timeoutPromise]);
        const { data, error } = result as any;
        
        if (error) {
          console.error("Gemini chat function error:", error);
          throw error;
        }
        
        if (!data || !data.response) {
          console.error("Gemini chat returned invalid response:", data);
          throw new Error("Invalid response received from AI");
        }
        
        return data.response;
      } catch (fetchError: any) {
        console.error("Error in Gemini chat request:", fetchError);
        if (fetchError.message.includes('timed out')) {
          return "I'm sorry, I'm taking too long to respond right now. Could you please try a shorter message or try again in a moment?";
        }
        throw fetchError;
      }
    } catch (error: any) {
      console.error("Error generating coach response:", error);
      return "I'm having trouble connecting right now. Please try again with a shorter message.";
    }
  };

  const clearTodaysMessages = async () => {
    if (!user) return false;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());
        
      if (error) throw error;
      
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
      
      const uniqueDates = new Set();
      data.forEach(message => {
        const date = new Date(message.created_at).toISOString().split('T')[0];
        uniqueDates.add(date);
      });
      
      return Array.from(uniqueDates) as string[];
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
