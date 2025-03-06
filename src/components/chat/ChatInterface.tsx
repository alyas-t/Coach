
import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import VoiceInput from "./VoiceInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Settings } from "lucide-react";
import { motion } from "@/utils/animation";

interface Message {
  id: string;
  content: string;
  sender: "user" | "coach";
  timestamp: Date;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Good morning! How are you feeling today?",
      sender: "coach",
      timestamp: new Date(Date.now() - 60000),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputText.trim() === "") return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputText("");
    
    // Simulate coach typing
    setIsTyping(true);
    
    // Simulate coach response after a delay
    setTimeout(() => {
      const coachReply: Message = {
        id: (Date.now() + 1).toString(),
        content: generateCoachResponse(inputText),
        sender: "coach",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, coachReply]);
      setIsTyping(false);
    }, 1500);
  };

  const handleVoiceInput = (transcript: string) => {
    setInputText(transcript);
    setIsVoiceMode(false);
  };

  // Mock response generation - in a real app this would use AI
  const generateCoachResponse = (userMessage: string): string => {
    const responses = [
      "I understand. How would you like to approach that?",
      "That's interesting. Tell me more about how that's affecting your goals.",
      "Thank you for sharing. What steps do you think you could take next?",
      "I hear you. Would it help to break this down into smaller steps?",
      "That's great progress! How did that make you feel?",
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

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
