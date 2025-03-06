
import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import VoiceInput from "./VoiceInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Settings, Loader2, Volume2, VolumeX } from "lucide-react";
import { motion } from "@/utils/animation";
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
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { getMessages, sendMessage, generateCoachResponse } = useChatMessages();
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
        const chatMessages = await getMessages();
        const profile = await getProfile();
        setUserProfile(profile);
        
        if (chatMessages.length === 0) {
          // Add personalized welcome message if no messages exist
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
  }, [user, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-4 pb-4">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <MessageBubble message={message} />
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2 py-2"
            >
              <div className="inline-block bg-primary/10 text-primary rounded-full p-2 px-3 ml-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: "200ms" }}></div>
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: "400ms" }}></div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>
      
      {isVoiceMode ? (
        <VoiceInput onTranscript={handleVoiceInput} onCancel={() => setIsVoiceMode(false)} />
      ) : (
        <div className="border-t p-4">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setIsVoiceMode(true)} 
              className="shrink-0"
            >
              <Mic className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="focus-ring"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={inputText.trim() === ""}
              size="icon"
              className="shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline"
              size="icon" 
              className="shrink-0"
              onClick={toggleSpeech}
              title={speechEnabled ? "Disable voice" : "Enable voice"}
            >
              {speechEnabled ? (
                <Volume2 className="h-5 w-5 text-muted-foreground" />
              ) : (
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
            <Button 
              variant="outline"
              size="icon" 
              className="shrink-0"
            >
              <Settings className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
