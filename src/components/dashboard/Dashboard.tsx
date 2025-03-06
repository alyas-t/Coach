
import { useState, useEffect } from "react";
import DashboardHeader from "./DashboardHeader";
import DashboardGoals from "./DashboardGoals";
import WeeklyProgressChart from "./WeeklyProgressChart";
import DailyCheckIn from "./DailyCheckIn";
import UpcomingCheckIns from "./UpcomingCheckIns";
import { motion } from "@/utils/animation";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useGoals } from "@/hooks/useGoals";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [goals, setGoals] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkIns, setCheckIns] = useState<any[]>([]);
  
  const { user } = useAuth();
  const { getGoals, updateGoalProgress } = useGoals();
  const { getProfile } = useProfile();
  const navigate = useNavigate();
  
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    async function loadData() {
      setLoading(true);
      try {
        const goalsData = await getGoals();
        setGoals(goalsData);
        
        const profileData = await getProfile();
        setProfile(profileData);
        
        const today = new Date().toISOString().split('T')[0];
        const { data: checkInsData, error } = await supabase
          .from('check_ins')
          .select('*')
          .eq('user_id', user.id)
          .eq('check_in_date', today);
          
        if (error) throw error;
        setCheckIns(checkInsData || []);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [user, navigate, getGoals, getProfile]);

  const handleUpdateGoalProgress = async (id: string, progress: number) => {
    try {
      await updateGoalProgress(id, progress);
      
      setGoals(prev => 
        prev.map(goal => 
          goal.id === id 
            ? { 
                ...goal, 
                progress, 
                ...(progress === 1 && goal.progress < 1 
                  ? { 
                      streak: (goal.streak || 0) + 1, 
                      days_completed: (goal.days_completed || 0) + 1 
                    } 
                  : {}
                )
              } 
            : goal
        )
      );
    } catch (error) {
      console.error("Error updating goal progress:", error);
    }
  };

  const handleAddGoal = (newGoal: any) => {
    setGoals(prev => [...prev, newGoal]);
  };

  const handleCalendarClick = () => {
    navigate('/calendar');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardHeader 
        profile={profile} 
        formattedDate={formattedDate} 
        handleCalendarClick={handleCalendarClick} 
      />

      <DailyCheckIn />

      <DashboardGoals 
        goals={goals}
        handleUpdateGoalProgress={handleUpdateGoalProgress}
        handleAddGoal={handleAddGoal}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <WeeklyProgressChart />
        <UpcomingCheckIns />
      </div>
    </div>
  );
};

export default Dashboard;
