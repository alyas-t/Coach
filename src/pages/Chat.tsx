
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatInterface from "@/components/chat/ChatInterface";
import PageTransition from "@/components/layout/PageTransition";
import Header from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatMessages } from "@/hooks/useChatMessages";
import { toast } from "sonner";

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [lastChatDate, setLastChatDate] = useState<string | null>(null);
  const [historicalDates, setHistoricalDates] = useState<string[]>([]);
  const { getChatDays } = useChatMessages();
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Check if we've already loaded messages today
    const today = new Date().toISOString().split('T')[0];
    const storedChatDate = localStorage.getItem('last_chat_date');
    
    if (storedChatDate !== today) {
      localStorage.setItem('last_chat_date', today);
      setLastChatDate(today);
    } else {
      setLastChatDate(storedChatDate);
    }
    
    // Load chat history dates
    const loadChatDays = async () => {
      setIsLoadingHistory(true);
      try {
        const days = await getChatDays();
        setHistoricalDates(days);
      } catch (error) {
        console.error("Error loading chat history:", error);
        toast.error("Failed to load chat history");
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    loadChatDays();
  }, [user, navigate, getChatDays]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const viewChatHistory = (date: string) => {
    localStorage.setItem('view_chat_date', date);
    navigate(`/chat?date=${date}`);
    setIsHistoryOpen(false);
  };

  if (!user) return null;

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="max-w-4xl mx-auto h-[calc(100vh-180px)]">
            <Card className="h-full overflow-hidden">
              <div className="flex items-center justify-between border-b p-3">
                <h2 className="text-lg font-medium">Chat with your coach</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  title="View chat history"
                >
                  <History className="h-5 w-5" />
                </Button>
              </div>
              
              {isHistoryOpen ? (
                <div className="p-4 h-full overflow-y-auto">
                  <h3 className="text-lg font-medium mb-4">Chat History</h3>
                  {isLoadingHistory ? (
                    <p className="text-muted-foreground">Loading history...</p>
                  ) : historicalDates.length > 0 ? (
                    <ul className="space-y-2">
                      {historicalDates.map((date) => (
                        <li key={date}>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start" 
                            onClick={() => viewChatHistory(date)}
                          >
                            {formatDate(date)}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No chat history found</p>
                  )}
                  
                  <div className="mt-4">
                    <Button 
                      className="w-full" 
                      onClick={() => setIsHistoryOpen(false)}
                    >
                      Back to Today's Chat
                    </Button>
                  </div>
                </div>
              ) : (
                <ChatInterface />
              )}
            </Card>
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default Chat;
