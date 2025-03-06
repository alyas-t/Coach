
import { useRef, useEffect } from "react";
import { Message } from "@/hooks/useChatMessages";
import MessageBubble from "./MessageBubble";
import { motion } from "@/utils/animation";
import { Loader2 } from "lucide-react";

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
  scrollToBottom: () => void;
}

const ChatMessages = ({ messages, isTyping, scrollToBottom }: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return (
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
  );
};

export default ChatMessages;
