
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define types for chat messages
interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  sender: 'user' | 'coach';
  created_at: string;
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
      // Avoid excessive type instantiation by using a more direct approach
      const response = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      const { data, error } = response;
      
      if (error) throw error;
      
      setMessages(data || []);
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
      
      // Use a direct approach to avoid deep type instantiation
      const response = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);
      
      const { data, error } = response;
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setMessages(prev => [...prev, ...data]);
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
      
      // Add the new message to the beginning since messages are ordered by created_at descending
      setMessages(prev => [data, ...prev]);
      
      return data;
    } catch (error) {
      console.error('Error adding message:', error);
      toast.error('Failed to send message');
      return null;
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
  };
}
