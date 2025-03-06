import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define types for chat messages
export interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  sender: 'user' | 'coach';
  created_at: string;
  timestamp?: Date;
}

// Type for the interface component
export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'coach';
  timestamp: Date;
}

// Custom hook for managing chat messages
export function useChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const { user } = useAuth();
  
  // Function to load the initial messages
  const loadInitialMessages = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      const { data, error } = response;
      
      if (error) throw error;
      
      // Cast the sender field to ensure it's either 'user' or 'coach'
      const typedData = data?.map(msg => ({
        ...msg,
        sender: msg.sender as 'user' | 'coach'
      })) || [];
      
      setMessages(typedData);
      setHasMore(data && data.length === 10);
      setPage(1);
    } catch (error) {
      console.error('Error loading chat messages:', error);
      toast.error('Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to load more messages when scrolling
  const loadMoreMessages = async () => {
    if (!user || !hasMore || isLoading) return;
    
    setIsLoading(true);
    try {
      const pageSize = 10;
      const offset = page * pageSize;
      
      const response = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);
      
      const { data, error } = response;
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Cast the sender field to ensure it's either 'user' or 'coach'
        const typedData = data.map(msg => ({
          ...msg,
          sender: msg.sender as 'user' | 'coach'
        }));
        
        setMessages(prev => [...prev, ...typedData]);
        setHasMore(data.length === pageSize);
        setPage(prev => prev + 1);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
      toast.error('Failed to load more messages');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to add a new message
  const addMessage = async (content: string, sender: 'user' | 'coach') => {
    if (!user) return null;
    
    try {
      const newMessage = {
        user_id: user.id,
        content,
        sender,
      };
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert(newMessage)
        .select()
        .single();
      
      if (error) throw error;
      
      // Cast the sender field
      const typedData = {
        ...data,
        sender: data.sender as 'user' | 'coach'
      };
      
      // Add the new message to the beginning since messages are ordered by created_at descending
      setMessages(prev => [typedData, ...prev]);
      
      return typedData;
    } catch (error) {
      console.error('Error adding message:', error);
      toast.error('Failed to send message');
      return null;
    }
  };

  // Function to get messages for ChatInterface
  const getMessages = async (): Promise<Message[]> => {
    if (!user) return [];
    
    // If messages are already loaded, convert and return them
    if (messages.length > 0) {
      return messages
        .slice()
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map(msg => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender,
          timestamp: new Date(msg.created_at)
        }));
    }
    
    // Otherwise load messages
    await loadInitialMessages();
    
    // Convert and return the loaded messages
    return messages
      .slice()
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender,
        timestamp: new Date(msg.created_at)
      }));
  };

  // Function to send a message and return it in the Message format
  const sendMessage = async (content: string, sender: 'user' | 'coach'): Promise<Message | null> => {
    const result = await addMessage(content, sender);
    if (!result) return null;
    
    return {
      id: result.id,
      content: result.content,
      sender: result.sender,
      timestamp: new Date(result.created_at)
    };
  };

  // Function to generate a coach response
  const generateCoachResponse = async (userMessage: string, previousMessages: Message[]): Promise<string> => {
    try {
      // Call the Edge Function to get AI response
      const response = await fetch(`${supabase.url}/functions/v1/gemini-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.session()?.access_token}`
        },
        body: JSON.stringify({
          message: userMessage,
          history: previousMessages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            content: msg.content
          }))
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.response || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
      console.error('Error generating coach response:', error);
      return "I'm having trouble connecting right now. Please try again later.";
    }
  };

  // Function to clear today's messages
  const clearTodaysMessages = async () => {
    if (!user) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());
      
      if (error) throw error;
      
      // Clear messages from state as well
      setMessages([]);
    } catch (error) {
      console.error('Error clearing messages:', error);
      toast.error('Failed to clear today\'s messages');
    }
  };

  // Function to get distinct chat days for history
  const getChatDays = async (): Promise<string[]> => {
    if (!user) return [];
    
    try {
      // Using a raw SQL query to get distinct days
      const { data, error } = await supabase
        .from('chat_messages')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Extract unique dates (YYYY-MM-DD format)
      const uniqueDates = new Set<string>();
      data?.forEach(msg => {
        const dateOnly = new Date(msg.created_at).toISOString().split('T')[0];
        uniqueDates.add(dateOnly);
      });
      
      return Array.from(uniqueDates);
    } catch (error) {
      console.error('Error getting chat days:', error);
      toast.error('Failed to load chat history dates');
      return [];
    }
  };
  
  // Load initial messages on component mount
  useEffect(() => {
    if (user) {
      loadInitialMessages();
    }
  }, [user]);
  
  return {
    messages: messages.slice().sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ), // Return chronologically sorted messages
    isLoading,
    hasMore,
    loadMoreMessages,
    addMessage,
    getMessages,
    sendMessage,
    generateCoachResponse,
    clearTodaysMessages,
    getChatDays
  };
}
