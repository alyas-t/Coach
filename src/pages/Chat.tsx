
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ChatInterface from "@/components/chat/ChatInterface";
import PageTransition from "@/components/layout/PageTransition";
import Header from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { History, Volume2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatMessages } from "@/hooks/useChatMessages";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TextToSpeech from "@/utils/textToSpeech";

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
  const [lastChatDate, setLastChatDate] = useState<string | null>(null);
  const [historicalDates, setHistoricalDates] = useState<string[]>([]);
  const { getChatDays } = useChatMessages();
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("21m00Tcm4TlvDq8ikWAM"); // Default to Rachel

  useEffect(() => {
    const tts = TextToSpeech.getInstance();
    // Load ElevenLabs voices
    const voices = tts.getElevenLabsVoices();
    setAvailableVoices(voices);
    
    // Check if there's a preferred voice in localStorage
    const savedVoice = localStorage.getItem('preferred_voice');
    if (savedVoice) {
      setSelectedVoice(savedVoice);
      tts.setVoicePreference(savedVoice);
    }
  }, []);

  // Function to load chat history with retry mechanism
  const loadChatHistory = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    setHistoryError(false);
    
    try {
      console.log("Loading chat history days");
      
      let attempts = 0;
      const maxAttempts = 3;
      let success = false;
      let days: string[] = [];
      
      while (attempts < maxAttempts && !success) {
        try {
          days = await getChatDays();
          success = true;
        } catch (err) {
          attempts++;
          console.error(`Attempt ${attempts} failed to load chat history:`, err);
          
          if (attempts >= maxAttempts) {
            throw err;
          }
          
          // Wait with exponential backoff before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
        }
      }
      
      console.log("Received chat days:", days);
      setHistoricalDates(days);
    } catch (error) {
      console.error("Error loading chat history:", error);
      setHistoryError(true);
      toast.error("Failed to load chat history", {
        description: "We couldn't retrieve your previous conversations",
        action: {
          label: "Retry",
          onClick: () => loadChatHistory()
        }
      });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user, getChatDays]);

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
    
    // Check if we have a date parameter in the URL
    const dateParam = searchParams.get('date');
    if (dateParam) {
      localStorage.setItem('view_chat_date', dateParam);
    }
    
    // Load chat history dates
    loadChatHistory();
  }, [user, navigate, loadChatHistory, searchParams]);

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

  const retryLoadHistory = async () => {
    if (isLoadingHistory) return;
    await loadChatHistory();
  };
  
  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    const tts = TextToSpeech.getInstance();
    tts.setVoicePreference(voiceId);
    // Save preference to localStorage
    localStorage.setItem('preferred_voice', voiceId);
    toast.success("Voice updated successfully");
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
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsVoiceSettingsOpen(!isVoiceSettingsOpen)}
                    title="Voice settings"
                  >
                    <Volume2 className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    title="View chat history"
                  >
                    <History className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {isVoiceSettingsOpen ? (
                <div className="p-4 h-full overflow-y-auto">
                  <h3 className="text-lg font-medium mb-4">Voice Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Select Voice</label>
                      <Select value={selectedVoice} onValueChange={handleVoiceChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a voice" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableVoices.map((voice) => (
                            <SelectItem key={voice.id} value={voice.id}>
                              {voice.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Using ElevenLabs for more realistic voices
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Button 
                      className="w-full" 
                      onClick={() => setIsVoiceSettingsOpen(false)}
                    >
                      Back to Chat
                    </Button>
                  </div>
                </div>
              ) : isHistoryOpen ? (
                <div className="p-4 h-full overflow-y-auto">
                  <h3 className="text-lg font-medium mb-4">Chat History</h3>
                  {isLoadingHistory ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : historyError ? (
                    <div className="text-center py-6">
                      <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
                      <p className="text-muted-foreground mb-4">Failed to load chat history</p>
                      <Button onClick={retryLoadHistory}>
                        Retry
                      </Button>
                    </div>
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
                    <p className="text-muted-foreground text-center py-6">No chat history found</p>
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
