
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Calendar, MessageSquare, RefreshCw, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const ChatHistory = ({ onClose }: { onClose: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatDays, setChatDays] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useAuth();

  // Fetch chat days with retry logic
  const fetchChatDays = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Loading chat history days");
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by date (ignoring time)
      const days = new Set<string>();
      if (data && data.length > 0) {
        data.forEach(message => {
          const date = new Date(message.created_at).toISOString().split('T')[0];
          days.add(date);
        });
        setChatDays(Array.from(days));
      } else {
        setChatDays([]);
      }
    } catch (error: any) {
      console.error("Error fetching chat days:", error);
      setError(error.message || "Failed to load chat history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchChatDays();
  }, [user, retryCount]);

  // Handle day selection with improved error handling
  const handleDaySelect = async (day: string) => {
    setSelectedDay(day);
    setLoadingMessages(true);
    setMessageError(null);

    try {
      // Convert the selected day to timestamp ranges
      const startOfDay = new Date(day);
      const endOfDay = new Date(day);
      endOfDay.setDate(endOfDay.getDate() + 1);

      // Add retry logic for message fetching
      let attempts = 0;
      const maxAttempts = 3;
      let success = false;
      let result = null;
      
      while (attempts < maxAttempts && !success) {
        try {
          const response = await supabase
            .from('chat_messages')
            .select('*')
            .eq('user_id', user.id)
            .gte('created_at', startOfDay.toISOString())
            .lt('created_at', endOfDay.toISOString())
            .order('created_at', { ascending: true });
            
          if (response.error) throw response.error;
          
          result = response.data;
          success = true;
        } catch (err) {
          attempts++;
          console.error(`Attempt ${attempts} failed to fetch messages:`, err);
          
          if (attempts < maxAttempts) {
            // Wait before retry with exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
          } else {
            throw err;
          }
        }
      }

      setMessages(result || []);
    } catch (error: any) {
      console.error("Error fetching messages for day:", error);
      setMessageError(error.message || "Failed to load messages for this day");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleRetry = () => {
    if (selectedDay) {
      handleDaySelect(selectedDay);
    } else {
      setRetryCount(prev => prev + 1);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chat History</DialogTitle>
          <DialogDescription>
            View your past chat conversations
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
          {/* Calendar/Days List */}
          <Card className="md:col-span-1 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">Chat Days</CardTitle>
              {loading ? null : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRetry}
                  title="Refresh chat days"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="p-4 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
                  <p className="text-sm text-destructive mb-2">{error}</p>
                  <Button variant="outline" size="sm" onClick={handleRetry}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[60vh]">
                  <div className="px-3 py-2">
                    {chatDays.length > 0 ? (
                      chatDays.map((day) => (
                        <Button
                          key={day}
                          variant={selectedDay === day ? "default" : "ghost"}
                          className="w-full justify-start mb-1"
                          onClick={() => handleDaySelect(day)}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          {format(new Date(day), "MMM d, yyyy")}
                        </Button>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground p-2 text-center">
                        No chat history found
                      </p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Message View */}
          <Card className="md:col-span-2 h-full">
            <CardHeader>
              <CardTitle className="text-base">
                {selectedDay
                  ? `Conversation on ${format(new Date(selectedDay), "MMMM d, yyyy")}`
                  : "Select a day to view messages"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[60vh]">
                <div className="px-4 py-2">
                  {selectedDay ? (
                    loadingMessages ? (
                      <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : messageError ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <AlertCircle className="h-10 w-10 text-destructive mb-2" />
                        <p className="text-sm text-destructive mb-4">{messageError}</p>
                        <Button variant="outline" size="sm" onClick={handleRetry}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      </div>
                    ) : messages.length > 0 ? (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`p-3 rounded-lg ${
                              message.sender === "coach"
                                ? "bg-primary/10 text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <div className="flex items-center mb-1">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              <span className="font-medium">
                                {message.sender === "coach" ? "Coach" : "You"}
                              </span>
                              <span className="text-xs ml-auto text-muted-foreground">
                                {format(new Date(message.created_at), "h:mm a")}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No messages found for this day
                      </p>
                    )
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Select a day from the list to view your conversation
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatHistory;
