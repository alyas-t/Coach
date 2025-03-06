
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useGoals } from "@/hooks/useGoals";
import { toast } from "sonner";

interface AddGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddGoal: (goal: any) => void;
}

const AddGoalDialog = ({ open, onOpenChange, onAddGoal }: AddGoalDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("daily");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { saveGoals } = useGoals();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Please enter a goal title");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create the goal object
      const newGoal = {
        title,
        description,
        type,
        progress: 0,
        days_completed: 0,
        streak: 0
      };
      
      // Save to database
      await saveGoals([newGoal]);
      
      // Add to UI with a temporary ID
      onAddGoal({
        ...newGoal,
        id: crypto.randomUUID() // This will be replaced when the component reloads
      });
      
      // Reset form
      setTitle("");
      setDescription("");
      setType("daily");
      
      toast.success("Goal added successfully");
    } catch (error) {
      console.error("Error adding goal:", error);
      toast.error("Failed to add goal");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Goal</DialogTitle>
            <DialogDescription>
              Create a new goal to track your progress
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Goal Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Exercise regularly"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your goal in detail..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Goal Type</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "daily", label: "Daily" },
                  { id: "weekly", label: "Weekly" },
                  { id: "monthly", label: "Monthly" }
                ].map((option) => (
                  <Button
                    key={option.id}
                    type="button"
                    variant={type === option.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setType(option.id)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Goal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddGoalDialog;
