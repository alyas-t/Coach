
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Loader2, Bell } from "lucide-react";
import { motion } from "@/utils/animation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import TextToSpeech from "@/utils/textToSpeech";

interface DailyCheckInProps {
  checkInType: "morning" | "evening";
  checkIns: any[];
}

const DailyCheckIn = ({ checkInType, checkIns }: DailyCheckInProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [response, setResponse] = useState("");
  const { user } = useAuth();
  
  // Get the most recent check-in of the specified type
  const checkIn = checkIns.length > 0 ? checkIns[0] : null;
  
  const handleComplete = async () => {
    if (!checkIn || !user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('check_ins')
        .update({
          response,
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', checkIn.id);
      
      if (error) throw error;
      
      // Refresh the page to show updated check-in status
      window.location.reload();
      
      toast.success("Check-in completed successfully!");
      
      // Read the response aloud
      if (TextToSpeech.getInstance().getEnabled()) {
        const feedbackMessage = checkInType === 'morning' 
          ? "Great planning! I've recorded your intentions for the day." 
          : "Thanks for reflecting on your day. Your insights help build better habits.";
        
        TextToSpeech.getInstance().speak(feedbackMessage);
      }
    } catch (error) {
      console.error("Error saving check-in:", error);
      toast.error("Failed to save your check-in");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSkip = async () => {
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
      
      // Refresh the page to show updated check-in status
      window.location.reload();
      
      toast.success("Check-in skipped");
    } catch (error) {
      console.error("Error skipping check-in:", error);
      toast.error("Failed to skip your check-in");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleVoiceResponse = () => {
    // Create a speech recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in your browser");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setResponse(prev => prev + (prev ? ' ' : '') + transcript);
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      toast.error("Error recording your response. Please try again.");
    };
    
    toast.info("Listening... Speak your response");
    recognition.start();
  };

  const readCheckInAloud = () => {
    if (checkIn && checkIn.question) {
      TextToSpeech.getInstance().speak(checkIn.question);
    }
  };

  if (!checkIn) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No {checkInType} check-in available</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              You don't have a {checkInType} check-in for today. Use the "Request New Check-in" button to create one.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (checkIn.completed) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="bg-green-100 border border-green-200 rounded-full p-2 mr-4">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-900">
                {checkInType === 'morning' ? 'Morning check-in completed' : 'Evening reflection completed'}
              </h3>
              <p className="text-sm text-green-700">
                {checkIn.response && (
                  <>Your response: "{checkIn.response.slice(0, 50)}{checkIn.response.length > 50 ? '...' : ''}"</>
                )}
                {!checkIn.response && 'Great job! Your coach will review your check-in.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardContent className="p-0">
        <div className={`bg-gradient-to-r ${
          checkInType === 'morning' 
            ? 'from-blue-100 to-blue-50 text-blue-900' 
            : 'from-purple-100 to-purple-50 text-purple-900'
        } p-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-medium">
                {checkInType === 'morning' ? 'Morning Check-in' : 'Evening Reflection'}
              </h3>
              <p className="text-sm opacity-80">
                {checkInType === 'morning' 
                  ? 'Start your day with intention and awareness' 
                  : 'Reflect on your progress and challenges today'}
              </p>
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/90 hover:bg-white border-white/20"
                onClick={readCheckInAloud}
              >
                Play Aloud
              </Button>
              <Button
                variant="outline"
                className="bg-white/90 hover:bg-white border-white/20"
                onClick={handleSkip}
                disabled={isSaving}
                size="sm"
              >
                Skip
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >            
            <h4 className="text-lg font-medium">{checkIn.question}</h4>
            
            <div className="bg-muted/50 rounded-lg p-4 min-h-[100px] border border-border">
              <Textarea
                className="w-full bg-transparent resize-none focus:outline-none min-h-[80px]"
                placeholder="Type your response here..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
              />
            </div>
            
            <div className="flex justify-between gap-3 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleVoiceResponse}
                className="gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" x2="12" y1="19" y2="22"></line>
                </svg>
                Voice Input
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSkip} disabled={isSaving}>
                  <X className="h-4 w-4 mr-1" /> Skip
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleComplete} 
                  disabled={isSaving || !response.trim()}
                  className={checkInType === 'morning' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}
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
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyCheckIn;
