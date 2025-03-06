
import { Loader2 } from "lucide-react";

const ChatLoading = () => {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading your chat...</p>
      </div>
    </div>
  );
};

export default ChatLoading;
