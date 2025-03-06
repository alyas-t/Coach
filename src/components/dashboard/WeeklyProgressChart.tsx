
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Loader2 } from "lucide-react";

interface DailyProgress {
  date: string;
  completed: number;
  total: number;
  percentage: number;
}

const WeeklyProgressChart = () => {
  const [progressData, setProgressData] = useState<DailyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchProgressData = async () => {
      setLoading(true);
      try {
        // Get the last 7 days
        const days = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(new Date(), i);
          return format(date, 'yyyy-MM-dd');
        }).reverse();

        // Fetch goals for user
        const { data: goals } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id);

        // Fetch check-ins for the last 7 days
        const { data: checkIns } = await supabase
          .from('check_ins')
          .select('*')
          .eq('user_id', user.id)
          .in('check_in_date', days);

        // Calculate daily progress
        const dailyProgress = days.map(day => {
          // Count completed check-ins for the day
          const dayCheckIns = checkIns?.filter(ci => ci.check_in_date === day) || [];
          const completedCheckIns = dayCheckIns.filter(ci => ci.completed).length;
          
          // Total check-ins expected per day (morning + evening = 2)
          const totalCheckIns = 2;
          
          // Calculate percentage
          const percentage = totalCheckIns > 0 
            ? (completedCheckIns / totalCheckIns) * 100 
            : 0;
          
          return {
            date: format(new Date(day), 'MM/dd'),
            completed: completedCheckIns,
            total: totalCheckIns,
            percentage
          };
        });

        setProgressData(dailyProgress);
      } catch (error) {
        console.error("Error fetching progress data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [user]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm text-xs">
          <p className="font-medium">{`${label}`}</p>
          <p>{`Completed: ${payload[0].value}%`}</p>
          <p>{`Check-ins: ${payload[0].payload.completed}/${payload[0].payload.total}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Progress</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : progressData.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(tick) => `${tick}%`} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="percentage" 
                  fill="var(--primary)" 
                  radius={[4, 4, 0, 0]} 
                  name="Progress" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            <p>No progress data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyProgressChart;
