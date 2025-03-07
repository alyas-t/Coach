
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ChatInterface from "@/components/chat/ChatInterface";
import PageTransition from "@/components/layout/PageTransition";
import Header from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { History, Volume2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatMessages } from "@/hooks/useChatMessages";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TextToSpeech from "@/utils/textToSpeech";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    try {
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
    } catch (error) {
      console.error("Error initializing text-to-speech:", error);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Function to load chat history with retry mechanism
  const loadChatHistory = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    setHistoryError(false);
    
    try {
      const days = await getChatDays();
      setHistoricalDates(days);
    } catch (error) {
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
    try {
      setSelectedVoice(voiceId);
      const tts = TextToSpeech.getInstance();
      tts.setVoicePreference(voiceId);
      // Save preference to localStorage
      localStorage.setItem('preferred_voice', voiceId);
      toast.success("Voice updated successfully");
    } catch (error) {
      console.error("Error changing voice:", error);
      toast.error("Failed to update voice");
    }
  };

  if (!user) return null;

  // Show loading state while initializing TTS
  if (isInitializing) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
            <div className="max-w-4xl mx-auto h-[calc(100vh-180px)]">
              <Card className="h-full overflow-hidden flex items-center justify-center">
                <div className="text-center">
                  <Skeleton className="h-8 w-8 rounded-full mx-auto mb-4" />
                  <p className="text-muted-foreground">Initializing chat capabilities...</p>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </PageTransition>
    );
  }

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
                      <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Failed to load chat history</AlertTitle>
                        <AlertDescription>
                          We couldn't retrieve your previous conversations. Please try again.
                        </AlertDescription>
                      </Alert>
                      <Button onClick={retryLoadHistory} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
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
