
import { useState } from "react";
import GoalCard from "./GoalCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { motion } from "@/utils/animation";
import AddGoalDialog from "./AddGoalDialog";

interface DashboardGoalsProps {
  goals: any[];
  handleUpdateGoalProgress: (id: string, progress: number) => Promise<void>;
  handleAddGoal: (newGoal: any) => void;
}

const DashboardGoals = ({ goals, handleUpdateGoalProgress, handleAddGoal }: DashboardGoalsProps) => {
  const [showAddGoal, setShowAddGoal] = useState(false);

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-medium">Your Goals</h2>
        <Button 
          size="sm" 
          variant="outline" 
          className="gap-1"
          onClick={() => setShowAddGoal(true)}
        >
          <Plus className="h-4 w-4" /> Add Goal
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {goals.length > 0 ? (
          goals.map((goal: any, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <GoalCard 
                goal={goal} 
                onProgressUpdate={handleUpdateGoalProgress} 
              />
            </motion.div>
          ))
        ) : (
          <div className="col-span-3 py-10 text-center">
            <p className="text-muted-foreground">
              You haven't set up any goals yet.
            </p>
            <Button 
              variant="outline" 
              className="mt-4 gap-1"
              onClick={() => setShowAddGoal(true)}
            >
              <Plus className="h-4 w-4" /> Add Your First Goal
            </Button>
          </div>
        )}
      </div>

      <AddGoalDialog 
        open={showAddGoal} 
        onOpenChange={setShowAddGoal}
        onAddGoal={handleAddGoal}
      />
    </section>
  );
};

export default DashboardGoals;
