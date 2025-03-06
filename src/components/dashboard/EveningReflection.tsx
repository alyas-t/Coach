
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save } from "lucide-react";

const EveningReflection = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user) return;
    if (!reflectionText.trim()) {
      toast.error("Please enter your evening reflection");
      return;
    }

    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if an evening check-in already exists for today
      const { data: existingCheckIn, error: checkError } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', user.id)
        .eq('check_in_date', today)
        .eq('check_in_type', 'evening')
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingCheckIn) {
        // Update existing check-in
        const { error } = await supabase
          .from('check_ins')
          .update({
            response: reflectionText,
            completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('id', existingCheckIn.id);

        if (error) throw error;
      } else {
        // Create new check-in
        const { error } = await supabase
          .from('check_ins')
          .insert({
            user_id: user.id,
            check_in_date: today,
            check_in_type: 'evening',
            question: 'How did your day go? What did you accomplish?',
            response: reflectionText,
            completed: true,
            completed_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      toast.success("Evening reflection saved successfully!");
      setIsOpen(false);
      // Refresh the page to update the check-ins list
      window.location.reload();
    } catch (error) {
      console.error("Error saving evening reflection:", error);
      toast.error("Failed to save evening reflection");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {!isOpen ? (
        <Button onClick={() => setIsOpen(true)}>Start Reflection</Button>
      ) : (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Evening Reflection</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="How did your day go? What did you accomplish? What could you have done better?"
              className="min-h-32"
              value={reflectionText}
              onChange={e => setReflectionText(e.target.value)}
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
                  Save Reflection
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
};

export default EveningReflection;
