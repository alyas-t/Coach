
import { useState, useRef, useEffect, useCallback } from "react";
import { useChatMessages, Message } from "@/hooks/useChatMessages";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import TextToSpeech from "@/utils/textToSpeech";
import { useAuth } from "@/context/AuthContext";

export function useChatInteraction() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastChatDate, setLastChatDate] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { getMessages, sendMessage, generateCoachResponse, clearTodaysMessages } = useChatMessages();
  const { getProfile } = useProfile();
  const navigate = useNavigate();
  const tts = useRef(TextToSpeech.getInstance());

  const loadMessages = useCallback(async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    setIsLoading(true);
    try {
      const profile = await getProfile();
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Check if we've already loaded messages today
      const storedChatDate = localStorage.getItem('last_chat_date');
      setLastChatDate(storedChatDate);
      
      // If the stored date is different from today, reset the chat
      if (storedChatDate !== today) {
        console.log("New day detected, resetting chat");
        // This will clear today's messages if they exist
        await clearTodaysMessages();
        localStorage.setItem('last_chat_date', today);
        setLastChatDate(today);
      }
      
      // Now load today's messages
      const chatMessages = await getMessages();
      
      if (chatMessages.length === 0) {
        // Add personalized welcome message if no messages exist for today
        const welcomeMessage = profile?.name 
          ? `Hello ${profile.name}! How are you feeling today?` 
          : "Good morning! How are you feeling today?";
          
        const initialMessage: Message = {
          id: "welcome",
          content: welcomeMessage,
          sender: "coach" as "coach",
          timestamp: new Date()
        };
        setMessages([initialMessage]);
        
        // Save the welcome message to the database
        await sendMessage(initialMessage.content, initialMessage.sender);
        
        // Speak the welcome message
        tts.current.speak(welcomeMessage);
      } else {
        setMessages(chatMessages);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load your chat history");
    } finally {
      setIsLoading(false);
    }
  }, [user, navigate, getMessages, sendMessage, clearTodaysMessages, getProfile]);

  useEffect(() => {
    loadMessages();
    
    return () => {
      // Cancel any ongoing speech when component unmounts
      tts.current.cancel();
    };
  }, [loadMessages]);

  const handleSendMessage = async (inputText: string) => {
    if (inputText.trim() === "") return;

    // Create a temporary message with a temporary ID
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      content: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);
    
    // Simulate coach typing
    setIsTyping(true);
    
    // Cancel any ongoing speech
    tts.current.cancel();
    
    try {
      // Save user message to database
      const savedUserMessage = await sendMessage(inputText, "user");
      
      if (savedUserMessage) {
        // Replace the temporary message with the saved one
        setMessages((prev) => 
          prev.map(msg => msg.id === tempUserMessage.id ? savedUserMessage : msg)
        );
      }
      
      // Get AI response using Gemini API with user context
      const aiResponse = await generateCoachResponse(inputText, messages);
      
      // Save coach message to database
      const savedCoachMessage = await sendMessage(aiResponse, "coach");
      
      if (savedCoachMessage) {
        setMessages((prev) => [...prev, savedCoachMessage]);
        
        // Return the AI response text to be spoken by the caller if needed
        return aiResponse;
      }
      
    } catch (error) {
      console.error("Error handling message:", error);
      toast.error("Something went wrong sending your message");
    } finally {
      setIsTyping(false);
    }
  };

  const scrollToBottom = useCallback(() => {
    const messagesEndElement = document.getElementById('messages-end');
    messagesEndElement?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return {
    messages,
    isTyping,
    isLoading,
    handleSendMessage,
    scrollToBottom,
    tts
  };
}
