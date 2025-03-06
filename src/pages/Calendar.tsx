
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import PageTransition from "@/components/layout/PageTransition";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckIn = {
  id: string;
  user_id: string;
  check_in_date: string;
  question: string;
  response: string | null;
  completed: boolean | null;
  check_in_type: 'morning' | 'evening' | string | null;
  created_at: string | null;
  completed_at: string | null;
};

type DayWithCheckIns = {
  date: Date;
  checkIns: CheckIn[];
  status: 'completed' | 'partial' | 'pending' | 'future';
};

const Calendar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDayCheckIns, setSelectedDayCheckIns] = useState<CheckIn[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchCheckIns = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('check_ins')
          .select('*')
          .eq('user_id', user.id)
          .order('check_in_date', { ascending: false });

        if (error) throw error;
        setCheckIns(data || []);
      } catch (error) {
        console.error("Error fetching check-ins:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCheckIns();
  }, [user, navigate]);

  useEffect(() => {
    if (selectedDate) {
      const formatted = selectedDate.toISOString().split('T')[0];
      const dayCheckIns = checkIns.filter(ci => ci.check_in_date === formatted);
      setSelectedDayCheckIns(dayCheckIns);
    }
  }, [selectedDate, checkIns]);

  const getDayStatus = (date: Date): 'completed' | 'partial' | 'pending' | 'future' => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Future dates
    if (date > today) return 'future';
    
    const formatted = date.toISOString().split('T')[0];
    const dayCheckIns = checkIns.filter(ci => ci.check_in_date === formatted);
    
    if (dayCheckIns.length === 0) return 'pending';
    
    // All check-ins completed
    if (dayCheckIns.every(ci => ci.completed)) return 'completed';
    
    // Some check-ins completed
    if (dayCheckIns.some(ci => ci.completed)) return 'partial';
    
    return 'pending';
  };

  // Prepare the modifiers for the calendar
  const getDaysWithCheckIns = (): Record<string, Date[]> => {
    const completedDays: Date[] = [];
    const partialDays: Date[] = [];
    const pendingDays: Date[] = [];
    
    // Get unique dates from check-ins
    const uniqueDates = [...new Set(checkIns.map(ci => ci.check_in_date))];
    
    uniqueDates.forEach(dateStr => {
      const date = new Date(dateStr);
      const status = getDayStatus(date);
      
      if (status === 'completed') {
        completedDays.push(date);
      } else if (status === 'partial') {
        partialDays.push(date);
      } else if (status === 'pending') {
        pendingDays.push(date);
      }
    });
    
    return {
      completed: completedDays,
      partial: partialDays,
      pending: pendingDays,
    };
  };

  // Helper to format the date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!user) return null;

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <h1 className="text-3xl font-bold mb-6">Check-In Calendar</h1>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="p-2">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                      modifiers={getDaysWithCheckIns()}
                      modifiersClassNames={{
                        completed: "bg-green-100 text-green-800 font-medium hover:bg-green-200",
                        partial: "bg-yellow-100 text-yellow-800 font-medium hover:bg-yellow-200",
                        pending: "bg-red-100 text-red-800 font-medium hover:bg-red-200"
                      }}
                    />
                    <div className="flex gap-4 mt-4 text-sm">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        <span>Completed</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                        <span>Partial</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                        <span>Pending</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedDate ? formatDate(selectedDate) : "Select a date"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDayCheckIns.length > 0 ? (
                  <div className="space-y-4">
                    {selectedDayCheckIns.map((checkIn) => (
                      <div
                        key={checkIn.id}
                        className={cn(
                          "p-4 rounded-lg border",
                          checkIn.completed
                            ? "border-green-200 bg-green-50"
                            : "border-gray-200 bg-gray-50"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">
                            {checkIn.check_in_type === "morning"
                              ? "Morning Planning"
                              : "Evening Reflection"}
                          </h3>
                          <span
                            className={cn(
                              "text-xs font-medium px-2 py-1 rounded-full",
                              checkIn.completed
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            )}
                          >
                            {checkIn.completed ? "Completed" : "Pending"}
                          </span>
                        </div>
                        {checkIn.response && (
                          <p className="text-sm text-gray-600 mt-2">
                            {checkIn.response}
                          </p>
                        )}
                        {checkIn.completed_at && (
                          <p className="text-xs text-gray-500 mt-2">
                            Completed at:{" "}
                            {new Date(checkIn.completed_at).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-64 text-gray-500">
                    No check-ins for this date
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default Calendar;
