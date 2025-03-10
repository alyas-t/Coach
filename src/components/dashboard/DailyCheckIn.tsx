import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Loader2, ArrowLeft, ArrowRight, Volume2, Settings } from "lucide-react";
import { motion } from "@/utils/animation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TextToSpeech from "@/utils/textToSpeech";
import VoiceCheckIn from "@/components/ui/voiceCheckIn";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const DailyCheckIn = () => {
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("morning");
  const { user } = useAuth();
  const tts = TextToSpeech.getInstance();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMenuOpen, setVoiceMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleSpeakStart = () => setIsSpeaking(true);
    const handleSpeakEnd = () => setIsSpeaking(false);
    
    tts.onSpeakStart(handleSpeakStart);
    tts.onSpeakEnd(handleSpeakEnd);
    
    return () => {
      tts.offSpeakStart(handleSpeakStart);
      tts.offSpeakEnd(handleSpeakEnd);
    };
  }, []);
  
  useEffect(() => {
    const fetchTodayCheckIns = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        
        const { data, error } = await supabase
          .from('check_ins')
          .select('*')
          .eq('user_id', user.id)
          .eq('check_in_date', today);
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Infer check-in type from the question content
          const morningPattern = /morning|plan|today|feeling|goals today/i;
          const eveningPattern = /evening|reflection|went well|how did you do|today's goals/i;
          
          const processedCheckIns = data.map(checkIn => {
            // Determine type based on question content
            let type = "morning"; // Default
            if (eveningPattern.test(checkIn.question)) {
              type = "evening";
            } else if (morningPattern.test(checkIn.question)) {
              type = "morning";
            }
            
            return {
              ...checkIn,
              check_in_type: type
            };
          });
          
          setCheckIns(processedCheckIns);
          
          // Initialize responses state with existing responses
          const initialResponses: Record<string, string> = {};
          processedCheckIns.forEach(checkIn => {
            if (checkIn.response) {
              initialResponses[checkIn.id] = checkIn.response;
            } else {
              initialResponses[checkIn.id] = '';
            }
          });
          setResponses(initialResponses);
          
          // Set active tab to evening if it exists and is not completed, otherwise morning
          const eveningCheckIn = processedCheckIns.find(c => c.check_in_type === 'evening');
          const morningCheckIn = processedCheckIns.find(c => c.check_in_type === 'morning');
          
          if (eveningCheckIn && !eveningCheckIn.completed) {
            setActiveTab('evening');
          } else if (morningCheckIn && !morningCheckIn.completed) {
            setActiveTab('morning');
          }
        } else {
          // Create both morning and evening check-ins
          const checkInsToCreate = [
            {
              user_id: user.id,
              question: "How are you feeling about your goals today?",
              check_in_date: today,
              completed: false,
              check_in_type: "morning"
            },
            {
              user_id: user.id,
              question: "How did you do with your goals today?",
              check_in_date: today,
              completed: false,
              check_in_type: "evening"
            }
          ];
          
          const { data: newCheckIns, error: insertError } = await supabase
            .from('check_ins')
            .insert(checkInsToCreate)
            .select();
          
          if (insertError) throw insertError;
          
          // Initialize responses for new check-ins
          const initialResponses: Record<string, string> = {};
          newCheckIns.forEach((checkIn: any) => {
            initialResponses[checkIn.id] = '';
          });
          
          setCheckIns(newCheckIns);
          setResponses(initialResponses);
        }
      } catch (error) {
        console.error("Error fetching check-ins:", error);
        toast.error("Could not load your daily check-ins");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTodayCheckIns();
  }, [user]);
  
  const handleComplete = async (checkIn: any) => {
    if (!checkIn || !user) return;
    
    setIsSaving(true);
    try {
      const response = responses[checkIn.id]?.trim() || '';
      
      if (!response) {
        toast.error("Please provide a response before completing");
        setIsSaving(false);
        return;
      }
      
      const { error } = await supabase
        .from('check_ins')
        .update({
          response: response,
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', checkIn.id);
      
      if (error) throw error;
      
      setCheckIns(prev => 
        prev.map(item => 
          item.id === checkIn.id 
            ? {...item, completed: true, response: response} 
            : item
        )
      );
      
      toast.success("Check-in completed successfully!");
      
      // If we completed a morning check-in, switch to evening tab if it exists
      if (checkIn.check_in_type === 'morning') {
        const eveningCheckIn = checkIns.find(c => c.check_in_type === 'evening');
        if (eveningCheckIn && !eveningCheckIn.completed) {
          setActiveTab('evening');
        }
      }
    } catch (error) {
      console.error("Error saving check-in:", error);
      toast.error("Failed to save your check-in");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async (checkIn: any) => {
    if (!checkIn || !user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('check_ins')
        .update({
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', checkIn.id);
      
      if (error) throw error;
      
      setCheckIns(prev => 
        prev.map(item => 
          item.id === checkIn.id 
            ? {...item, completed: true} 
            : item
        )
      );
      toast.success("Check-in skipped");
      
      // If we skipped a morning check-in, switch to evening tab if it exists
      if (checkIn.check_in_type === 'morning') {
        const eveningCheckIn = checkIns.find(c => c.check_in_type === 'evening');
        if (eveningCheckIn && !eveningCheckIn.completed) {
          setActiveTab('evening');
        }
      }
    } catch (error) {
      console.error("Error skipping check-in:", error);
      toast.error("Failed to skip your check-in");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSpeakQuestion = async (question: string) => {
    try {
      if (isSpeaking) {
        tts.cancel();
        return;
      }
      
      await tts.speak(question);
    } catch (error) {
      console.error("Error speaking question:", error);
      toast.error("Failed to speak question");
    }
  };

  const handleVoiceTranscription = (checkInId: string, text: string) => {
    setResponses(prev => ({
      ...prev,
      [checkInId]: (prev[checkInId] || '') + ' ' + text
    }));
  };

  const handleVoiceChange = (voiceName: string) => {
    tts.setVoicePreference(voiceName);
    toast.success("Voice changed successfully");
    setVoiceMenuOpen(false);
  };

  const renderCheckInForm = (checkIn: any) => {
    if (checkIn.completed) {
      return (
        <div className="p-6 text-center bg-muted/20 rounded-lg">
          <p className="text-muted-foreground">
            You've already completed your {checkIn.check_in_type} check-in for today.
          </p>
          <p className="mt-4 p-4 bg-muted/10 rounded border border-border text-sm">
            "{checkIn.response}"
          </p>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-medium">{checkIn.question}</h4>
          <div className="flex gap-2">
            <DropdownMenu open={voiceMenuOpen} onOpenChange={setVoiceMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="text-sm font-medium px-2 py-1.5 text-muted-foreground">Select Voice</div>
                {tts.getAvailableVoices().map(voice => (
                  <DropdownMenuItem key={voice.name} onClick={() => handleVoiceChange(voice.name)}>
                    {voice.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant={isSpeaking ? "secondary" : "ghost"} 
              size="sm" 
              className={isSpeaking ? "text-primary" : "text-muted-foreground"}
              onClick={() => handleSpeakQuestion(checkIn.question)}
            >
              <span className="sr-only">{isSpeaking ? "Stop" : "Listen"}</span>
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 min-h-[100px] border border-border">
          <Textarea
            className="w-full bg-transparent resize-none focus:outline-none min-h-[80px]"
            placeholder="Type your response here..."
            value={responses[checkIn.id] || ''}
            onChange={(e) => setResponses(prev => ({ ...prev, [checkIn.id]: e.target.value }))}
          />
          <div className="flex justify-center mt-4">
            <VoiceCheckIn
              onTranscription={(text) => handleVoiceTranscription(checkIn.id, text)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={() => handleSkip(checkIn)} disabled={isSaving}>
            <X className="h-4 w-4 mr-1" /> Skip
          </Button>
          <Button 
            size="sm" 
            onClick={() => handleComplete(checkIn)} 
            disabled={isSaving || !(responses[checkIn.id] || '').trim()}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" /> Complete
              </>
            )}
          </Button>
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6 flex justify-center items-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Loading your daily check-ins...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (checkIns.length === 0) {
    return null;
  }

  const checkInsByType: Record<string, any> = {};
  checkIns.forEach(checkIn => {
    checkInsByType[checkIn.check_in_type] = checkIn;
  });

  const allCompleted = checkIns.every(c => c.completed);
  if (allCompleted) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="bg-green-100 border border-green-200 rounded-full p-2 mr-4">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-900">Today's check-ins completed</h3>
              <p className="text-sm text-green-700">
                Great job! Your coach will review your responses.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/20">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-medium text-primary-foreground">
                Daily Check-ins
              </h3>
              <p className="text-sm text-primary-foreground/70">
                Start your day with intention and end with reflection
              </p>
            </div>
            <TabsList className="mt-4 sm:mt-0">
              <TabsTrigger value="morning" disabled={!checkInsByType.morning}>
                Morning
              </TabsTrigger>
              <TabsTrigger value="evening" disabled={!checkInsByType.evening}>
                Evening
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        
        {Object.entries(checkInsByType).map(([type, checkIn]) => (
          <TabsContent key={type} value={type} className="p-0 m-0">
            <CardContent className="p-6">
              {renderCheckInForm(checkIn)}
            </CardContent>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
};

export default DailyCheckIn;
