
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "@/utils/animation";
import { ArrowLeft, ArrowRight, Plus, Trash2, List } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GoalSettingFormProps {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  type: string;
}

const GoalSettingForm = ({
  formData,
  updateFormData,
  onNext,
  onPrev,
}: GoalSettingFormProps) => {
  const [goals, setGoals] = useState<Goal[]>(
    formData.goals?.length
      ? formData.goals
      : [
          {
            id: crypto.randomUUID(),
            title: "",
            description: "",
            type: "daily",
          },
        ]
  );
  const [currentGoal, setCurrentGoal] = useState<Goal>(goals[0]);
  const [editMode, setEditMode] = useState(!goals[0].title);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validGoals = goals.filter(g => g.title.trim() !== "");
    if (validGoals.length === 0) {
      return; // Don't proceed if no valid goals
    }
    
    updateFormData({ goals: validGoals });
    onNext();
  };

  const updateGoal = (goal: Goal) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === goal.id ? { ...goal } : g))
    );
    setCurrentGoal(goal);
  };

  const addGoal = () => {
    const newGoal = {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      type: "daily",
    };
    setGoals([...goals, newGoal]);
    setCurrentGoal(newGoal);
    setEditMode(true);
  };

  const removeGoal = (id: string) => {
    const updatedGoals = goals.filter((g) => g.id !== id);
    setGoals(updatedGoals);
    
    if (updatedGoals.length > 0 && currentGoal.id === id) {
      setCurrentGoal(updatedGoals[0]);
    } else if (updatedGoals.length === 0) {
      addGoal();
    }
  };

  const selectGoal = (goal: Goal) => {
    setCurrentGoal(goal);
    setEditMode(false);
  };

  const getGoalTypeLabel = (type: string) => {
    switch (type) {
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      case "monthly":
        return "Monthly";
      default:
        return "Custom";
    }
  };

  const isFormValid = goals.some((g) => g.title.trim() !== "");

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      variants={motion.staggerContainer}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={motion.staggerItem}>
        <h2 className="text-2xl font-medium mb-6">Set your goals</h2>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Goal list sidebar */}
          <div className="md:w-1/3 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <Label className="flex items-center gap-1">
                <List className="h-4 w-4" /> Your Goals
              </Label>
              <Button 
                type="button" 
                size="sm" 
                variant="ghost" 
                onClick={addGoal}
                className="px-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="max-h-[200px] overflow-y-auto pr-1 space-y-2">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  onClick={() => selectGoal(goal)}
                  className={`p-3 rounded-md cursor-pointer border transition-all ${
                    currentGoal.id === goal.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium truncate">
                        {goal.title || "Untitled Goal"}
                      </p>
                      {goal.title && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {getGoalTypeLabel(goal.type)}
                        </Badge>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeGoal(goal.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Goal editor */}
          <Card className="md:w-2/3 bg-background/50">
            <CardContent className="p-4">
              {editMode ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="goalTitle">Goal Title</Label>
                    <Input
                      id="goalTitle"
                      value={currentGoal.title}
                      onChange={(e) =>
                        updateGoal({ ...currentGoal, title: e.target.value })
                      }
                      placeholder="e.g., Exercise regularly"
                      className="focus-ring"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goalDescription">Description</Label>
                    <Textarea
                      id="goalDescription"
                      value={currentGoal.description}
                      onChange={(e) =>
                        updateGoal({ ...currentGoal, description: e.target.value })
                      }
                      placeholder="Describe your goal in detail..."
                      className="focus-ring min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goalType">Goal Type</Label>
                    <div className="flex flex-wrap gap-2">
                      {["daily", "weekly", "monthly"].map((type) => (
                        <Button
                          key={type}
                          type="button"
                          variant={currentGoal.type === type ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            updateGoal({ ...currentGoal, type })
                          }
                        >
                          {getGoalTypeLabel(type)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (currentGoal.title) {
                          setEditMode(false);
                        }
                      }}
                    >
                      {currentGoal.title ? "Done" : "Cancel"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">{currentGoal.title}</h3>
                    <Badge variant="outline" className="mt-1">
                      {getGoalTypeLabel(currentGoal.type)}
                    </Badge>
                  </div>
                  
                  {currentGoal.description && (
                    <p className="text-muted-foreground">{currentGoal.description}</p>
                  )}
                  
                  <div className="flex justify-end pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditMode(true)}
                    >
                      Edit Goal
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <motion.div variants={motion.staggerItem} className="pt-4 flex justify-between">
        <Button type="button" variant="outline" onClick={onPrev}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button
          type="submit"
          disabled={!isFormValid}
          className="gap-1"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.form>
  );
};

export default GoalSettingForm;
