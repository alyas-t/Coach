
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface Goal {
  id: string;
  title: string;
  description: string;
  type: string;
  progress?: number;
  days_completed?: number;
  streak?: number;
}

export function useGoals() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const saveGoals = async (goals: Omit<Goal, "id">[]) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const goalsData = goals.map(goal => ({
        user_id: user.id,
        title: goal.title,
        description: goal.description,
        type: goal.type,
        progress: goal.progress || 0,
        days_completed: goal.days_completed || 0,
        streak: goal.streak || 0
      }));

      const { error } = await supabase
        .from('goals')
        .insert(goalsData);

      if (error) throw error;
      toast.success("Goals saved successfully");
    } catch (error: any) {
      toast.error("Error saving goals");
      console.error("Error saving goals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGoals = async () => {
    if (!user) return [];
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error fetching goals:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const updateGoalProgress = async (id: string, progress: number) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data: goalData } = await supabase
        .from('goals')
        .select('progress, streak, days_completed')
        .eq('id', id)
        .single();
      
      // Update streak and days_completed when completing a goal
      let updatedData: {
        progress: number;
        streak?: number;
        days_completed?: number;
      } = { progress };
      
      if (progress === 1 && goalData?.progress < 1) {
        updatedData = {
          progress,
          streak: (goalData?.streak || 0) + 1,
          days_completed: (goalData?.days_completed || 0) + 1
        };
      }

      const { error } = await supabase
        .from('goals')
        .update(updatedData)
        .eq('id', id);

      if (error) throw error;
      toast.success("Goal progress updated");
    } catch (error: any) {
      console.error("Error updating goal progress:", error);
      toast.error("Error updating goal");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      toast.success("Goal deleted successfully");
    } catch (error: any) {
      console.error("Error deleting goal:", error);
      toast.error("Error deleting goal");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveGoals,
    getGoals,
    updateGoalProgress,
    deleteGoal,
    isLoading
  };
}
