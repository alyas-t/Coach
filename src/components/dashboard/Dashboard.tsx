
import { useState } from "react";
import GoalCard from "./GoalCard";
import ProgressChart from "./ProgressChart";
import DailyCheckIn from "./DailyCheckIn";
import { motion } from "@/utils/animation";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock data - in a real app this would come from a database
const mockGoals = [
  {
    id: "1",
    title: "Morning exercise routine",
    description: "Complete 30 minutes of cardio",
    type: "daily",
    progress: 0.75,
    daysCompleted: 5,
    streak: 5,
  },
  {
    id: "2",
    title: "Read for personal development",
    description: "Read 20 pages daily",
    type: "daily",
    progress: 0.5,
    daysCompleted: 3,
    streak: 3,
  },
  {
    id: "3",
    title: "Practice mindfulness",
    description: "15 minutes of meditation",
    type: "daily",
    progress: 0.25,
    daysCompleted: 2,
    streak: 0,
  },
];

const Dashboard = () => {
  const [goals, setGoals] = useState(mockGoals);
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const userFirstName = "Alex"; // This would come from the user profile

  const updateGoalProgress = (id: string, progress: number) => {
    setGoals(
      goals.map((goal) =>
        goal.id === id ? { ...goal, progress } : goal
      )
    );
  };

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-medium tracking-tight">
              Hello, {userFirstName}
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
          {goals.map((goal) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: parseInt(goal.id) * 0.1 }}
            >
              <GoalCard goal={goal} updateProgress={updateGoalProgress} />
            </motion.div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart data={goals} />
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
