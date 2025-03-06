
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pie, PieChart, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts";
import { CalendarDays, BarChart3, PieChart as PieChartIcon, TrendingUp } from "lucide-react";

interface StatsSectionProps {
  goals: any[];
  checkIns: any[];
}

const StatsSection = ({ goals, checkIns }: StatsSectionProps) => {
  const [statsView, setStatsView] = useState<"overview" | "goals" | "checkIns">("overview");
  
  // Calculate goal statistics
  const completedGoals = goals.filter((g) => g.progress === 1).length;
  const inProgressGoals = goals.filter((g) => g.progress > 0 && g.progress < 1).length;
  const notStartedGoals = goals.filter((g) => g.progress === 0).length;
  
  const goalsByType = goals.reduce((acc: Record<string, number>, goal) => {
    acc[goal.type] = (acc[goal.type] || 0) + 1;
    return acc;
  }, {});
  
  const goalTypeData = Object.entries(goalsByType).map(([name, value]) => ({
    name,
    value,
  }));
  
  // Check-in statistics
  const totalCheckIns = checkIns.length;
  const completedCheckIns = checkIns.filter((c) => c.completed).length;
  const completionRate = totalCheckIns > 0 ? Math.round((completedCheckIns / totalCheckIns) * 100) : 0;
  
  // Mock data for the week's history
  const weeklyData = [
    { name: "Mon", completed: 2, attempted: 3 },
    { name: "Tue", completed: 3, attempted: 4 },
    { name: "Wed", completed: 1, attempted: 2 },
    { name: "Thu", completed: 4, attempted: 4 },
    { name: "Fri", completed: 2, attempted: 3 },
    { name: "Sat", completed: 3, attempted: 5 },
    { name: "Sun", completed: completedCheckIns, attempted: totalCheckIns },
  ];
  
  // Colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Mock streak data
  const streakData = [
    { name: "Current", value: Math.max(...goals.map((g) => g.streak || 0), 0) },
    { name: "Average", value: goals.reduce((acc, g) => acc + (g.streak || 0), 0) / (goals.length || 1) },
    { name: "Best", value: Math.max(...goals.map((g) => g.streak || 0), 3) },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Performance Analytics</CardTitle>
            <Tabs defaultValue={statsView} onValueChange={(v) => setStatsView(v as any)}>
              <TabsList className="grid grid-cols-3 h-8">
                <TabsTrigger value="overview" className="text-xs px-2">Overview</TabsTrigger>
                <TabsTrigger value="goals" className="text-xs px-2">Goals</TabsTrigger>
                <TabsTrigger value="checkIns" className="text-xs px-2">Check-ins</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {statsView === "overview" && (
            <div className="pt-2">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">Streak</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {Math.max(...goals.map((g) => g.streak || 0), 0)} days
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {streakData[2].value > streakData[0].value ? `Best: ${streakData[2].value} days` : "Current streak is your best!"}
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 mb-1">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-sm font-medium">Completion</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {completionRate}%
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {completedCheckIns}/{totalCheckIns} check-ins completed
                  </div>
                </div>
              </div>
              
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" name="Completed" fill="#059669" />
                    <Bar dataKey="attempted" name="Attempted" fill="#D1D5DB" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          
          {statsView === "goals" && (
            <div className="pt-2 grid grid-cols-2 gap-4">
              <div className="flex items-center justify-center h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Completed", value: completedGoals },
                        { name: "In Progress", value: inProgressGoals },
                        { name: "Not Started", value: notStartedGoals },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      <Cell fill="#4ade80" /> {/* green */}
                      <Cell fill="#facc15" /> {/* yellow */}
                      <Cell fill="#94a3b8" /> {/* gray */}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Goal Progress</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span> Completed
                    </span>
                    <span className="text-xs font-medium">{completedGoals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs flex items-center gap-1">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full"></span> In Progress
                    </span>
                    <span className="text-xs font-medium">{inProgressGoals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs flex items-center gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span> Not Started
                    </span>
                    <span className="text-xs font-medium">{notStartedGoals}</span>
                  </div>
                </div>
                
                {goalTypeData.length > 0 && (
                  <>
                    <h4 className="text-sm font-medium mt-4 mb-2">Goals by Type</h4>
                    <div className="space-y-2">
                      {goalTypeData.map((item, index) => (
                        <div key={item.name} className="flex justify-between">
                          <span className="text-xs flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span> {item.name}
                          </span>
                          <span className="text-xs font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          
          {statsView === "checkIns" && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-medium">Check-in Completion</h4>
                  <p className="text-2xl font-bold">{completionRate}%</p>
                </div>
                <div className="h-16 w-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Completed", value: completedCheckIns },
                          { name: "Missed", value: totalCheckIns - completedCheckIns },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={15}
                        outerRadius={30}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                      >
                        <Cell fill="#4ade80" />
                        <Cell fill="#e5e7eb" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Last 7 days</span>
                  <span>Completion rate</span>
                </div>
                
                <div className="h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={11} />
                      <YAxis fontSize={11} domain={[0, 'dataMax + 1']} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="completed" 
                        name="Completed"
                        stroke="#4ade80" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="attempted" 
                        name="Total"
                        stroke="#94a3b8" 
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
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
            <div className="flex items-center justify-between p-3 border rounded-md bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <div>
                <p className="font-medium text-blue-800">Morning Check-in</p>
                <p className="text-sm text-blue-700">Tomorrow at 8:00 AM</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 px-3 bg-white"
              >
                Reminder
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-md bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <div>
                <p className="font-medium text-purple-800">Evening Reflection</p>
                <p className="text-sm text-purple-700">Today at 8:00 PM</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 px-3 bg-white"
              >
                Reminder
              </Button>
            </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3">Weekly Streak Progress</h4>
              <div className="grid grid-cols-7 gap-1">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <div key={day + i} className="flex flex-col items-center">
                    <div className="text-xs text-muted-foreground mb-1">{day}</div>
                    <div 
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        i < 5 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {i < 5 ? '✓' : '·'}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Weekly goal progress</span>
                  <span className="text-sm font-medium">65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsSection;
