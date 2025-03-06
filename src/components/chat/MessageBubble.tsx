
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    sender: "user" | "coach";
    timestamp: Date;
  };
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isCoach = message.sender === "coach";
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex items-start gap-2 ${isCoach ? 'mr-12' : 'ml-12 flex-row-reverse'}`}>
      <Avatar className="w-8 h-8">
        {isCoach ? (
          <>
            <AvatarImage src="/placeholder.svg" alt="Coach" />
            <AvatarFallback className="bg-primary text-primary-foreground">
              PC
            </AvatarFallback>
          </>
        ) : (
          <>
            <AvatarImage src="/placeholder.svg" alt="User" />
            <AvatarFallback className="bg-muted text-muted-foreground">
              ME
            </AvatarFallback>
          </>
        )}
      </Avatar>
      
      <div
        className={`relative rounded-lg py-2 px-3 max-w-[85%] ${
          isCoach
            ? 'bg-primary/10 text-foreground'
            : 'bg-primary text-primary-foreground'
        }`}
      >
        <div className="text-sm">{message.content}</div>
        <div 
          className={`text-[10px] mt-1 opacity-70 ${
            isCoach ? '' : 'text-primary-foreground/70'
          }`}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
