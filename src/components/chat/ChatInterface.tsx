import { useState, useRef, useEffect, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import VoiceInput from "./VoiceInput";
import VoiceChatModal from "./VoiceChatModal";
import ChatHistory from "./ChatHistory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Loader2, Volume2, VolumeX, Headphones, History, RefreshCw, AlertCircle } from "lucide-react";
import { motion } from "@/utils/animation";
import { useAuth } from "@/context/AuthContext";
import { useChatMessages, Message } from "@/hooks/useChatMessages";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import TextToSpeech from "@/utils/textToSpeech";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [lastChatDate, setLastChatDate] = useState<string | null>(null);
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { getMessages, sendMessage, generateCoachResponse, clearTodaysMessages } = useChatMessages();
  const { getProfile } = useProfile();
  const navigate = useNavigate();
  const tts = useRef(TextToSpeech.getInstance());

  const loadChatMessages = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      let profile = null;
      
      try {
        profile = await getProfile();
        setUserProfile(profile);
      } catch (profileError) {
        console.error("Error loading profile:", profileError);
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      const storedChatDate = localStorage.getItem('last_chat_date');
      setLastChatDate(storedChatDate);
      
      if (storedChatDate !== today) {
        await clearTodaysMessages();
        localStorage.setItem('last_chat_date', today);
        setLastChatDate(today);
      }
      
      const chatMessages = await getMessages();
      
      if (chatMessages.length === 0) {
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
        
        try {
          await sendMessage(initialMessage.content, initialMessage.sender);
        } catch (error) {
          console.error("Failed to save welcome message:", error);
        }
        
        tts.current.speak(welcomeMessage);
      } else {
        setMessages(chatMessages);
      }
      
      setConsecutiveErrors(0);
    } catch (error: any) {
      setLoadError(error);
      setConsecutiveErrors(prev => prev + 1);
      
      toast.error("Failed to load your chat", {
        description: "Please try refreshing the page",
        action: {
          label: "Retry",
          onClick: () => loadChatMessages()
        }
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, getMessages, sendMessage, clearTodaysMessages, getProfile]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    loadChatMessages();
    
    return () => {
      tts.current.cancel();
    };
  }, [user, navigate, loadChatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string = inputText) => {
    if (text.trim() === "" || isMessageSending) return;

    setIsMessageSending(true);
    
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      content: text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);
    setInputText("");
    
    setIsTyping(true);
    
    tts.current.cancel();
    
    try {
      const savedUserMessage = await sendMessage(text, "user");
      
      if (savedUserMessage) {
        setMessages((prev) => 
          prev.map(msg => msg.id === tempUserMessage.id ? savedUserMessage : msg)
        );
      } else {
        toast.error("Could not save your message, but continuing conversation");
      }
      
      const aiResponse = await generateCoachResponse(text, messages);
      
      const savedCoachMessage = await sendMessage(aiResponse, "coach");
      
      if (savedCoachMessage) {
        setMessages((prev) => [...prev, savedCoachMessage]);
      } else {
        const tempCoachMessage: Message = {
          id: `temp-coach-${Date.now()}`,
          content: aiResponse,
          sender: "coach",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, tempCoachMessage]);
        toast.error("Could not save the AI response, but displaying it anyway");
      }
      
      if (speechEnabled) {
        setTimeout(() => {
          tts.current.speak(aiResponse);
        }, 300);
      }
      
      setConsecutiveErrors(0);
    } catch (error) {
      console.error("Error handling message:", error);
      toast.error("Something went wrong sending your message");
      
      const fallbackMessage: Message = {
        id: `fallback-${Date.now()}`,
        content: "I'm having trouble processing your message right now. Let's try again in a moment.",
        sender: "coach",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, fallbackMessage]);
      
      setConsecutiveErrors(prev => prev + 1);
      
      if (consecutiveErrors >= 2) {
        toast.error("There seems to be a persistent issue connecting to the AI. Please try refreshing the page or checking your connection.");
      }
    } finally {
      setIsTyping(false);
      setIsMessageSending(false);
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

  if (consecutiveErrors >= 3) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection issues detected</AlertTitle>
              <AlertDescription>
                We're having trouble connecting to our servers. This might be due to a network issue or a temporary service disruption.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col gap-2">
              <Button 
                className="w-full" 
                onClick={() => {
                  setConsecutiveErrors(0);
                  loadChatMessages();
                }}
                variant="default"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button 
                className="w-full" 
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Failed to load chat</AlertTitle>
              <AlertDescription>
                There was a problem loading your chat messages. This could be due to a network issue.
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full" 
              onClick={loadChatMessages}
              variant="default"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
    <div className="h-full flex flex-col relative">
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
              title="Voice input"
              disabled={isMessageSending}
            >
              <Mic className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsVoiceChatOpen(true)}
              className="shrink-0"
              title="Voice chat mode"
              disabled={isMessageSending}
            >
              <Headphones className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isMessageSending) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="focus-ring"
              disabled={isMessageSending}
            />
            <Button 
              onClick={() => handleSendMessage()} 
              disabled={inputText.trim() === "" || isMessageSending}
              size="icon"
              className="shrink-0"
            >
              {isMessageSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
            <Button 
              variant="outline"
              size="icon" 
              className="shrink-0"
              onClick={toggleSpeech}
              title={speechEnabled ? "Disable voice" : "Enable voice"}
              disabled={isMessageSending}
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
              onClick={() => setIsHistoryOpen(true)}
              title="Chat history"
              disabled={isMessageSending}
            >
              <History className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      )}

      {isVoiceChatOpen && (
        <VoiceChatModal 
          isOpen={isVoiceChatOpen} 
          onClose={() => setIsVoiceChatOpen(false)} 
          onSendMessage={handleSendMessage}
        />
      )}

      {isHistoryOpen && (
        <ChatHistory onClose={() => setIsHistoryOpen(false)} />
      )}
    </div>
  );
};

export default ChatInterface;
