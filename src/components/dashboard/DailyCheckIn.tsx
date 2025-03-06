
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "@/utils/animation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TextToSpeech from "@/utils/textToSpeech";

const DailyCheckIn = () => {
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("morning");
  const { user } = useAuth();
  const tts = TextToSpeech.getInstance();
  
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
          .eq('check_in_date', today)
          .order('check_in_type', { ascending: true });
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          setCheckIns(data);
          
          // Initialize responses state with existing responses
          const initialResponses: Record<string, string> = {};
          data.forEach(checkIn => {
            if (checkIn.response) {
              initialResponses[checkIn.id] = checkIn.response;
            } else {
              initialResponses[checkIn.id] = '';
            }
          });
          setResponses(initialResponses);
          
          // Set active tab to evening if it exists and is not completed, otherwise morning
          const eveningCheckIn = data.find(c => c.check_in_type === 'evening');
          const morningCheckIn = data.find(c => c.check_in_type === 'morning');
          
          if (eveningCheckIn && !eveningCheckIn.completed) {
            setActiveTab('evening');
          } else if (morningCheckIn && !morningCheckIn.completed) {
            setActiveTab('morning');
          }
        } else {
          // Create a new morning check-in for today if none exists
          const defaultQuestion = "How are you feeling today?";
          const { data: newCheckIn, error: insertError } = await supabase
            .from('check_ins')
            .insert({
              user_id: user.id,
              question: defaultQuestion,
              check_in_date: today,
              check_in_type: 'morning',
              completed: false
            })
            .select()
            .single();
          
          if (insertError) throw insertError;
          setCheckIns([newCheckIn]);
          setResponses({ [newCheckIn.id]: '' });
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
      const { error } = await supabase
        .from('check_ins')
        .update({
          response: responses[checkIn.id] || '',
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', checkIn.id);
      
      if (error) throw error;
      
      setCheckIns(prev => 
        prev.map(item => 
          item.id === checkIn.id 
            ? {...item, completed: true, response: responses[checkIn.id] || ''} 
            : item
        )
      );
      toast.success("Check-in completed successfully!");
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
    } catch (error) {
      console.error("Error skipping check-in:", error);
      toast.error("Failed to skip your check-in");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSpeakQuestion = (question: string) => {
    tts.speak(question);
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

  // Group check-ins by type
  const checkInsByType: Record<string, any> = {};
  checkIns.forEach(checkIn => {
    checkInsByType[checkIn.check_in_type] = checkIn;
  });

  // If all check-ins are completed, show a summary
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
              {!checkIn.completed ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >            
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-medium">{checkIn.question}</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground"
                      onClick={() => handleSpeakQuestion(checkIn.question)}
                    >
                      <span className="sr-only">Listen</span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                      </svg>
                    </Button>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-4 min-h-[100px] border border-border">
                    <Textarea
                      className="w-full bg-transparent resize-none focus:outline-none min-h-[80px]"
                      placeholder="Type your response here..."
                      value={responses[checkIn.id] || ''}
                      onChange={(e) => setResponses(prev => ({ ...prev, [checkIn.id]: e.target.value }))}
                    />
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
              ) : (
                <div className="p-6 text-center bg-muted/20 rounded-lg">
                  <p className="text-muted-foreground">
                    You've already completed your {type} check-in for today.
                  </p>
                  {type === 'morning' && !checkInsByType.evening?.completed && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="mt-2" 
                      onClick={() => setActiveTab('evening')}
                      disabled={!checkInsByType.evening}
                    >
                      Go to evening check-in <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                  {type === 'evening' && !checkInsByType.morning?.completed && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="mt-2" 
                      onClick={() => setActiveTab('morning')}
                      disabled={!checkInsByType.morning}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" /> Go to morning check-in
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
};

export default DailyCheckIn;
