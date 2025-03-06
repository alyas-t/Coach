
import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { motion } from "@/utils/animation";
import { CheckCircle, Clock, Flame, Loader2 } from "lucide-react";
import { useGoals } from "@/hooks/useGoals";

interface GoalCardProps {
  goal: {
    id: string;
    title: string;
    description: string;
    type: string;
    progress: number;
    days_completed: number;
    streak: number;
  };
  onProgressUpdate: (id: string, progress: number) => void;
}

const GoalCard = ({ goal, onProgressUpdate }: GoalCardProps) => {
  const [hovering, setHovering] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { updateGoalProgress } = useGoals();
  
  const isComplete = goal.progress >= 1;
  
  const handleComplete = async () => {
    setUpdating(true);
    try {
      await updateGoalProgress(goal.id, 1);
      onProgressUpdate(goal.id, 1);
    } finally {
      setUpdating(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 1) return "bg-green-500";
    if (progress >= 0.6) return "bg-blue-500";
    if (progress >= 0.3) return "bg-amber-500";
    return "bg-primary";
  };

  return (
    <Card
      className={`overflow-hidden transition-all duration-300 ${
        isComplete ? "border-green-200 bg-green-50/50" : ""
      }`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <CardContent className="p-5">
        <div className="mb-4 flex justify-between items-start">
          <h3 className="font-medium text-lg">{goal.title}</h3>
          {goal.streak > 0 && (
            <div className="flex items-center gap-1 bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-xs">
              <Flame className="h-3 w-3 text-amber-500" /> {goal.streak} day
              {goal.streak !== 1 ? "s" : ""}
            </div>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          {goal.description}
        </p>
        
        <div className="space-y-1">
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1" /> {goal.type}
            </span>
            <span>{Math.round(goal.progress * 100)}%</span>
          </div>
          <Progress
            value={goal.progress * 100}
            className={`h-2 ${getProgressColor(goal.progress)}`}
          />
        </div>
      </CardContent>
      
      <CardFooter className={`p-4 pt-0 gap-2 ${isComplete ? 'justify-between' : 'justify-end'}`}>
        {isComplete ? (
          <>
            <div className="flex items-center text-green-700 text-sm">
              <CheckCircle className="h-4 w-4 mr-1" />
              Completed
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 hover:bg-green-100"
            >
              Details
            </Button>
          </>
        ) : (
          <motion.div
            initial="hidden"
            animate={hovering ? "visible" : "hidden"}
            variants={{
              visible: { opacity: 1, y: 0 },
              hidden: { opacity: 0, y: 10 },
            }}
            transition={{ duration: 0.2 }}
          >
            <Button
              size="sm"
              onClick={handleComplete}
              className="text-xs h-7"
              disabled={updating}
            >
              {updating ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : null}
              Mark Complete
            </Button>
          </motion.div>
        )}
      </CardFooter>
    </Card>
  );
}

export default GoalCard;
