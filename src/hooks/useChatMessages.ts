
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface Message {
  id: string;
  content: string;
  sender: "user" | "coach";
  timestamp: Date;
}

export function useChatMessages() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const getMessages = async () => {
    if (!user) return [];
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      return data.map((message: any) => ({
        id: message.id,
        content: message.content,
        sender: message.sender as "user" | "coach", // Cast to the allowed types
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
        sender: data.sender as "user" | "coach", // Cast to the allowed types
        timestamp: new Date(data.created_at)
      };
    } catch (error: any) {
      console.error("Error sending message:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getMessages,
    sendMessage,
    isLoading
  };
}
