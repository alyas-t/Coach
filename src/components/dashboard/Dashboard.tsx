
import { useState, useEffect } from "react";
import GoalCard from "./GoalCard";
import ProgressChart from "./ProgressChart";
import DailyCheckIn from "./DailyCheckIn";
import StatsSection from "./StatsSection";
import { motion } from "@/utils/animation";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, MessageSquare, Loader2, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useGoals } from "@/hooks/useGoals";
import { useProfile } from "@/hooks/useProfile";
import AddGoalDialog from "./AddGoalDialog";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [goals, setGoals] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [checkInType, setCheckInType] = useState<"morning" | "evening">("morning");
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
        
        // Fetch today's check-ins
        const todayDate = new Date().toISOString().split('T')[0];
        const { data: checkInsData, error } = await supabase
          .from('check_ins')
          .select('*')
          .eq('user_id', user.id)
          .eq('check_in_date', todayDate)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setCheckIns(checkInsData || []);
        
        // Default to evening check-in in the evening hours
        const currentHour = new Date().getHours();
        if (currentHour >= 16) { // After 4 PM
          setCheckInType("evening");
        }
        
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [user, navigate]);

  const handleUpdateGoalProgress = async (id: string, progress: number) => {
    try {
      await updateGoalProgress(id, progress);
      
      // Update goals state
      setGoals(prev => 
        prev.map(goal => 
          goal.id === id 
            ? { 
                ...goal, 
                progress, 
                // If marking as complete, update streak and days_completed
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
    setShowAddGoal(false);
  };
  
  const triggerCheckIn = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          type: checkInType,
          userId: user.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to trigger check-in');
      }
      
      // Refresh check-ins
      const todayDate = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', user.id)
        .eq('check_in_date', todayDate)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCheckIns(data || []);
      
    } catch (error) {
      console.error("Error triggering check-in:", error);
    }
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
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-medium tracking-tight">
              Hello, {profile?.name || "there"}
            </h1>
            <p className="text-muted-foreground">
              {formattedDate} • <Badge variant="outline">Week 1</Badge>
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Link to="/chat">
              <Button className="gap-2" size="sm">
                <MessageSquare className="h-4 w-4" /> Chat with Coach
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="gap-1">
              <Calendar className="h-4 w-4" /> Calendar
            </Button>
          </div>
        </div>
      </header>

      <Tabs defaultValue={checkInType} onValueChange={(value) => setCheckInType(value as "morning" | "evening")}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="morning">Morning Check-in</TabsTrigger>
            <TabsTrigger value="evening">Evening Reflection</TabsTrigger>
          </TabsList>
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={triggerCheckIn}
            className="gap-1"
          >
            <Bell className="h-4 w-4" /> Request New Check-in
          </Button>
        </div>
        
        <TabsContent value="morning">
          <DailyCheckIn 
            checkInType="morning" 
            checkIns={checkIns.filter(c => c.check_in_type === 'morning')} 
          />
        </TabsContent>
        
        <TabsContent value="evening">
          <DailyCheckIn 
            checkInType="evening" 
            checkIns={checkIns.filter(c => c.check_in_type === 'evening')} 
          />
        </TabsContent>
      </Tabs>

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
      </section>

      <StatsSection goals={goals} checkIns={checkIns} />

      {/* Add Goal Dialog */}
      <AddGoalDialog 
        open={showAddGoal} 
        onOpenChange={setShowAddGoal}
        onAddGoal={handleAddGoal}
      />
    </div>
  );
};

export default Dashboard;
