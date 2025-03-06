
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Loader2 } from "lucide-react";
import { motion } from "@/utils/animation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const DailyCheckIn = () => {
  const [checkIn, setCheckIn] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [response, setResponse] = useState("");
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchTodayCheckIn = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        
        const { data, error } = await supabase
          .from('check_ins')
          .select('*')
          .eq('user_id', user.id)
          .eq('check_in_date', today)
          .single();
        
        if (error && error.code !== 'PGSQL_ERROR_NO_ROWS') {
          throw error;
        }
        
        if (data) {
          setCheckIn(data);
          if (data.response) {
            setResponse(data.response);
          }
        } else {
          // Create a new check-in for today
          const defaultQuestion = "How are you feeling today?";
          const { data: newCheckIn, error: insertError } = await supabase
            .from('check_ins')
            .insert({
              user_id: user.id,
              question: defaultQuestion,
              check_in_date: today,
              completed: false
            })
            .select()
            .single();
          
          if (insertError) throw insertError;
          setCheckIn(newCheckIn);
        }
      } catch (error) {
        console.error("Error fetching check-in:", error);
        toast.error("Could not load your daily check-in");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTodayCheckIn();
  }, [user]);
  
  const handleComplete = async () => {
    if (!checkIn || !user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('check_ins')
        .update({
          response,
          completed: true
        })
        .eq('id', checkIn.id);
      
      if (error) throw error;
      
      setCheckIn(prev => ({...prev, completed: true}));
      toast.success("Check-in completed successfully!");
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
          completed: true
        })
        .eq('id', checkIn.id);
      
      if (error) throw error;
      
      setCheckIn(prev => ({...prev, completed: true}));
      toast.success("Check-in skipped");
    } catch (error) {
      console.error("Error skipping check-in:", error);
      toast.error("Failed to skip your check-in");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6 flex justify-center items-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Loading your daily check-in...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!checkIn) {
    return null;
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
              <h3 className="font-medium text-green-900">Morning check-in completed</h3>
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
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-medium text-primary-foreground">
                Morning Check-in
              </h3>
              <p className="text-sm text-primary-foreground/70">
                Start your day with intention and awareness
              </p>
            </div>
            <Button
              variant="outline"
              className="mt-4 sm:mt-0 bg-white/90 hover:bg-white border-white/20 text-primary"
              onClick={handleSkip}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                "Skip Today"
              )}
            </Button>
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
            
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={handleSkip} disabled={isSaving}>
                <X className="h-4 w-4 mr-1" /> Skip
              </Button>
              <Button 
                size="sm" 
                onClick={handleComplete} 
                disabled={isSaving || !response.trim()}
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
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyCheckIn;
