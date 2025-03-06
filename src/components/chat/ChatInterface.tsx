
import { useState, useRef } from "react";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import VoiceInput from "./VoiceInput";
import VoiceChatModal from "./VoiceChatModal";
import ChatHistory from "./ChatHistory";
import { Loader2 } from "lucide-react";
import { useChatInteraction } from "@/hooks/useChatInteraction";
import { Message } from "@/hooks/useChatMessages";

const ChatInterface = () => {
  const [inputText, setInputText] = useState("");
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { 
    messages, 
    isTyping, 
    isLoading, 
    handleSendMessage, 
    scrollToBottom,
    tts 
  } = useChatInteraction();

  const sendMessage = async () => {
    if (inputText.trim() === "") return;
    
    const response = await handleSendMessage(inputText);
    setInputText("");
    
    // Speak the AI response if speech is enabled
    if (response && speechEnabled) {
      tts.current.speak(response);
    }
  };

  const handleVoiceInput = (transcript: string) => {
    setInputText(transcript);
    setIsVoiceMode(false);
  };
  
  const toggleSpeech = () => {
    const newState = tts.current.toggleEnabled();
    setSpeechEnabled(newState);
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
            handleSendMessage={sendMessage}
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
          onSendMessage={async (text) => {
            setInputText(text);
            await handleSendMessage(text);
          }}
        />
      )}

      {isHistoryOpen && (
        <ChatHistory onClose={() => setIsHistoryOpen(false)} />
      )}

      <div ref={messagesEndRef} id="messages-end" />
    </div>
  );
};

export default ChatInterface;
