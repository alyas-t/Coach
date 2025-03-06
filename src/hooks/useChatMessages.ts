import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface Message {
  id: string;
  content: string;
  sender: "user" | "coach";
  timestamp: Date;
}

// Define the database response type explicitly
interface ChatMessageRow {
  id: string;
  content: string;
  sender: string;
  created_at: string;
  user_id: string;
  chat_date?: string;
}

export function useChatMessages() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const getMessages = async (date?: string): Promise<Message[]> => {
    if (!user) return [];
    
    try {
      // If no date is provided, use today's date
      const queryDate = date || new Date().toISOString().split('T')[0];
      
      // Perform the query directly without chaining to avoid deep type instantiation
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('chat_date', queryDate)
        .order('created_at', { ascending: true }) as { data: any, error: any };
      
      if (error) throw error;
      
      // Process the raw data to our expected format
      const messages: Message[] = Array.isArray(data) ? data.map((message: ChatMessageRow) => ({
        id: message.id,
        content: message.content,
        sender: message.sender as "user" | "coach",
        timestamp: new Date(message.created_at)
      })) : [];
      
      return messages;
    } catch (error: any) {
      // Keep this error log as it's important for debugging issues with fetching messages
      console.error("Error fetching messages:", error);
      return [];
    }
  };

  const getChatDays = async (): Promise<string[]> => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('chat_date')
        .eq('user_id', user.id)
        .order('chat_date', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      
      // First convert to unknown, then to the expected type to avoid type errors
      const typedData = data as unknown as { chat_date: string }[];
      const uniqueDates = [...new Set(typedData.map(item => item.chat_date))];
      return uniqueDates;
    } catch (error: any) {
      // Keep this error log as it's important for debugging issues with fetching chat days
      console.error("Error fetching chat days:", error);
      return [];
    }
  };

  const sendMessage = async (content: string, sender: "user" | "coach"): Promise<Message | null> => {
    if (!user) return null;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([
          {
            user_id: user.id,
            content,
            sender,
            chat_date: today
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      
      // Type assertion for safety
      const typedData = data as unknown as ChatMessageRow;
      return {
        id: typedData.id,
        content: typedData.content,
        sender: typedData.sender as "user" | "coach",
        timestamp: new Date(typedData.created_at)
      };
    } catch (error: any) {
      // Keep this error log as it's important for debugging issues with sending messages
      console.error("Error sending message:", error);
      return null;
    }
  };

  const generateCoachResponse = async (message: string, previousMessages: Message[]): Promise<string> => {
    if (!user) throw new Error("User not authenticated");
    
    setIsLoading(true);
    
    try {
      // Create a timeout for the request
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 30000); // 30 second timeout
      
      // Limit message length for faster processing
      const shortenedMessage = message.length > 500 ? message.substring(0, 500) + "..." : message;
      
      // Prepare for API call
      const contextMessages = previousMessages
        .slice(-10) // Only include the last 10 messages for context
        .map(msg => ({
          role: msg.sender === "user" ? "user" : "model",
          content: msg.content.length > 300 ? msg.content.substring(0, 300) + "..." : msg.content
        }));
        
      const payload = {
        message: shortenedMessage,
        context: contextMessages,
        userId: user.id
      };
      
      // Call the edge function with a timeout
      const { data, error } = await supabase.functions.invoke("gemini-chat", {
        body: payload
      });
      
      clearTimeout(timeoutId);
      
      // Check if request was aborted after the fact
      if (abortController.signal.aborted) {
        throw new Error("Request timed out");
      }
      
      if (error) {
        // Keep this error log as it provides crucial information about edge function failures
        console.error("Edge function error:", error);
        throw new Error(`Failed to generate response: ${error.message}`);
      }
      
      if (!data || !data.response) {
        throw new Error("No response received from AI");
      }
      
      return data.response;
    } catch (error: any) {
      // Keep this error log as it's important for debugging AI response generation issues
      console.error("Error generating coach response:", error);
      
      if (error.message === "Request timed out" || error.message?.includes("timed out")) {
        throw new Error("AI response is taking too long. Please try a shorter message.");
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearTodaysMessages = async (): Promise<void> => {
    if (!user) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id)
        .eq('chat_date', today);
      
      if (error) throw error;
    } catch (error: any) {
      // Keep this error log as it's important for user feedback about message deletion
      console.error("Error clearing today's messages:", error);
      toast.error("Failed to clear messages");
    }
  };

  return {
    getMessages,
    getChatDays,
    sendMessage,
    generateCoachResponse,
    clearTodaysMessages,
    isLoading
  };
}
