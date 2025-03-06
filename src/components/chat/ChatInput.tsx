
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Volume2, VolumeX, Headphones, History } from "lucide-react";

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  handleSendMessage: () => void;
  setIsVoiceMode: (isVoice: boolean) => void;
  setIsVoiceChatOpen: (isOpen: boolean) => void;
  setIsHistoryOpen: (isOpen: boolean) => void;
  toggleSpeech: () => void;
  speechEnabled: boolean;
}

const ChatInput = ({
  inputText,
  setInputText,
  handleSendMessage,
  setIsVoiceMode,
  setIsVoiceChatOpen,
  setIsHistoryOpen,
  toggleSpeech,
  speechEnabled
}: ChatInputProps) => {
  return (
    <div className="border-t p-4">
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setIsVoiceMode(true)} 
          className="shrink-0"
          title="Voice input"
        >
          <Mic className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsVoiceChatOpen(true)}
          className="shrink-0"
          title="Voice chat mode"
        >
          <Headphones className="h-5 w-5 text-muted-foreground" />
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
          onClick={() => setIsHistoryOpen(true)}
          title="Chat history"
        >
          <History className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
