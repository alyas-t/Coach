
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save } from "lucide-react";

const MorningPlanning = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [planText, setPlanText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingPlan, setExistingPlan] = useState<any>(null);
  const { user } = useAuth();

  // Check for existing morning plan on component mount
  useEffect(() => {
    const checkExistingPlan = async () => {
      if (!user) return;
      
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('check_ins')
          .select('*')
          .eq('user_id', user.id)
          .eq('check_in_date', today)
          .eq('check_in_type', 'morning')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Error checking existing plan:", error);
          return;
        }

        if (data) {
          setExistingPlan(data);
          setPlanText(data.response || "");
          // Auto-open if there's an existing plan
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Error checking for existing plan:", error);
      }
    };

    checkExistingPlan();
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!planText.trim()) {
      toast.error("Please enter your morning plan");
      return;
    }

    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      if (existingPlan) {
        // Update existing check-in
        const { error } = await supabase
          .from('check_ins')
          .update({
            response: planText,
            completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('id', existingPlan.id);

        if (error) throw error;
      } else {
        // Create new check-in
        const { error } = await supabase
          .from('check_ins')
          .insert({
            user_id: user.id,
            check_in_date: today,
            check_in_type: 'morning',
            question: 'What are your goals for today?',
            response: planText,
            completed: true,
            completed_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      toast.success("Morning plan saved successfully!");
      setIsOpen(false);
      // Refresh the page to update the check-ins list
      window.location.reload();
    } catch (error) {
      console.error("Error saving morning plan:", error);
      toast.error("Failed to save morning plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {!isOpen ? (
        <Button onClick={() => setIsOpen(true)}>
          {existingPlan ? "Edit Morning Plan" : "Start Planning"}
        </Button>
      ) : (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Morning Planning</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="What are your goals for today? What are the most important tasks you want to accomplish?"
              className="min-h-32"
              value={planText}
              onChange={e => setPlanText(e.target.value)}
            />
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Plan
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
};

export default MorningPlanning;
