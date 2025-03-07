
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCoachSettings } from "@/hooks/useCoachSettings";
import { useEffect, useState } from "react";
import { Brain, Heart, Smile, Zap, Bot } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { getCoachSettings } = useCoachSettings();
  const [coachStyle, setCoachStyle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (isCoach) {
      const loadCoachStyle = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const settings = await getCoachSettings();
          if (settings) {
            setCoachStyle(settings.coachStyle);
          }
        } catch (error: any) {
          setError(error);
          // Set a default coach style on error
          setCoachStyle("supportive");
        } finally {
          setIsLoading(false);
        }
      };
      
      loadCoachStyle();
    }
  }, [isCoach, getCoachSettings]);
  
  const formatTime = (date: Date) => {
    try {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "--:--"; // Fallback time format
    }
  };

  const getCoachIcon = () => {
    if (isLoading) {
      return <Skeleton className="h-4 w-4 rounded-full" />;
    }
    
    switch (coachStyle) {
      case "supportive":
        return <Heart className="h-4 w-4" />;
      case "directive":
        return <Zap className="h-4 w-4" />;
      case "challenging":
        return <Smile className="h-4 w-4" />;
      case "analytical":
        return <Brain className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  // Ensure valid timestamp
  const safeTimestamp = message.timestamp instanceof Date && !isNaN(message.timestamp.getTime()) 
    ? message.timestamp 
    : new Date();

  return (
    <div className={`flex items-start gap-2 ${isCoach ? 'mr-12' : 'ml-12 flex-row-reverse'}`}>
      <Avatar className="w-8 h-8">
        {isCoach ? (
          <>
            <AvatarImage src="/placeholder.svg" alt="Coach" />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getCoachIcon()}
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
          {formatTime(safeTimestamp)}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
