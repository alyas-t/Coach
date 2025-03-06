
import { useState, useEffect } from "react";
import GoalCard from "./GoalCard";
import ProgressChart from "./ProgressChart";
import DailyCheckIn from "./DailyCheckIn";
import { motion } from "@/utils/animation";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, MessageSquare, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useGoals } from "@/hooks/useGoals";
import { useProfile } from "@/hooks/useProfile";

const Dashboard = () => {
  const [goals, setGoals] = useState([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const { getGoals } = useGoals();
  const { getProfile } = useProfile();
  
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      
      setLoading(true);
      try {
        const goalsData = await getGoals();
        setGoals(goalsData);
        
        const profileData = await getProfile();
        setProfile(profileData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [user]);

  const updateGoalProgress = (id: string, progress: number) => {
    setGoals(
      goals.map((goal: any) =>
        goal.id === id ? { ...goal, progress } : goal
      )
    );
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

      <DailyCheckIn />

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-medium">Your Goals</h2>
          <Button size="sm" variant="outline" className="gap-1">
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
                  onProgressUpdate={updateGoalProgress} 
                />
              </motion.div>
            ))
          ) : (
            <div className="col-span-3 py-10 text-center">
              <p className="text-muted-foreground">
                You haven't set up any goals yet.
              </p>
              <Button variant="outline" className="mt-4 gap-1">
                <Plus className="h-4 w-4" /> Add Your First Goal
              </Button>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {goals.length > 0 ? (
              <ProgressChart data={goals} />
            ) : (
              <div className="h-48 flex items-center justify-center">
                <p className="text-muted-foreground">
                  No goals to display progress
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div>
                    <p className="font-medium">
                      {i === 1 ? "Evening Reflection" : "Morning Planning"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {i === 1
                        ? "Today at 8:00 PM"
                        : "Tomorrow at 8:00 AM"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 px-3"
                  >
                    {i === 1 ? "Start" : "Reminder"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
