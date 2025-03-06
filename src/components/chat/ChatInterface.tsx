
import { useState, useRef, useEffect, useCallback } from "react";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import VoiceInput from "./VoiceInput";
import VoiceChatModal from "./VoiceChatModal";
import ChatHistory from "./ChatHistory";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useChatMessages, Message } from "@/hooks/useChatMessages";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import TextToSpeech from "@/utils/textToSpeech";

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [lastChatDate, setLastChatDate] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { getMessages, sendMessage, generateCoachResponse, clearTodaysMessages } = useChatMessages();
  const { getProfile } = useProfile();
  const navigate = useNavigate();
  const tts = useRef(TextToSpeech.getInstance());

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const profile = await getProfile();
        setUserProfile(profile);
        
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
    };
    
    loadMessages();
    
    return () => {
      // Cancel any ongoing speech when component unmounts
      tts.current.cancel();
    };
  }, [user, navigate, getMessages, sendMessage, clearTodaysMessages, getProfile]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleSendMessage = async () => {
    if (inputText.trim() === "") return;

    // Create a temporary message with a temporary ID
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      content: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);
    setInputText("");
    
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
        
        // Speak the AI response if speech is enabled
        if (speechEnabled) {
          tts.current.speak(aiResponse);
        }
      }
      
      setIsTyping(false);
    } catch (error) {
      console.error("Error handling message:", error);
      toast.error("Something went wrong sending your message");
      setIsTyping(false);
    }
  };

  const handleVoiceInput = (transcript: string) => {
    setInputText(transcript);
    setIsVoiceMode(false);
  };
  
  const toggleSpeech = () => {
    const newState = tts.current.toggleEnabled();
    setSpeechEnabled(newState);
    toast.info(newState ? "Voice feedback enabled" : "Voice feedback disabled");
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading your chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {isVoiceMode ? (
        <VoiceInput onTranscript={handleVoiceInput} onCancel={() => setIsVoiceMode(false)} />
      ) : (
        <>
          <ChatMessages 
            messages={messages} 
            isTyping={isTyping} 
            scrollToBottom={scrollToBottom} 
          />
          
          <ChatInput 
            inputText={inputText}
            setInputText={setInputText}
            handleSendMessage={handleSendMessage}
            setIsVoiceMode={setIsVoiceMode}
            setIsVoiceChatOpen={setIsVoiceChatOpen}
            setIsHistoryOpen={setIsHistoryOpen}
            toggleSpeech={toggleSpeech}
            speechEnabled={speechEnabled}
          />
        </>
      )}

      {isVoiceChatOpen && (
        <VoiceChatModal 
          isOpen={isVoiceChatOpen} 
          onClose={() => setIsVoiceChatOpen(false)} 
          onSendMessage={(text) => {
            setInputText(text);
            handleSendMessage();
          }}
        />
      )}

      {isHistoryOpen && (
        <ChatHistory onClose={() => setIsHistoryOpen(false)} />
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatInterface;
