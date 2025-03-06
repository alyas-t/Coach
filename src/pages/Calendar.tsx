
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, isToday, isSameDay } from "date-fns";
import { ArrowLeft, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import PageTransition from "@/components/layout/PageTransition";
import Header from "@/components/layout/Header";
import { toast } from "sonner";

const Calendar = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchCheckIns = async () => {
      setLoading(true);
      try {
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('check_ins')
          .select('*')
          .eq('user_id', user.id)
          .gte('check_in_date', startDateStr)
          .lte('check_in_date', endDateStr);
          
        if (error) throw error;
        
        setCheckIns(data || []);
      } catch (error) {
        console.error("Error fetching check-ins:", error);
        toast.error("Could not load your check-ins");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCheckIns();
  }, [user, navigate, date]);

  const getDayCompletionStatus = (day: Date) => {
    const formattedDay = format(day, 'yyyy-MM-dd');
    const dayCheckIns = checkIns.filter(ci => ci.check_in_date === formattedDay);
    
    if (dayCheckIns.length === 0) return 'none';
    
    const allCompleted = dayCheckIns.every(ci => ci.completed);
    const anyCompleted = dayCheckIns.some(ci => ci.completed);
    
    if (allCompleted) return 'completed';
    if (anyCompleted) return 'partial';
    return 'pending';
  };

  const renderCheckInsForSelectedDate = () => {
    const formattedSelectedDate = format(date, 'yyyy-MM-dd');
    const selectedDateCheckIns = checkIns.filter(ci => ci.check_in_date === formattedSelectedDate);
    
    if (selectedDateCheckIns.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No check-ins for this date.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {selectedDateCheckIns.map(checkIn => (
          <Card key={checkIn.id} className="border-primary/10">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-md font-medium mb-1">{checkIn.check_in_type === 'morning' ? 'Morning Planning' : 'Evening Reflection'}</h4>
                  <p className="text-sm text-muted-foreground">{checkIn.question}</p>
                </div>
                {checkIn.completed ? (
                  <div className="bg-green-100 rounded-full p-1">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                ) : (
                  <div className="bg-amber-100 rounded-full p-1">
                    <X className="h-5 w-5 text-amber-600" />
                  </div>
                )}
              </div>
              
              {checkIn.response && (
                <div className="mt-3 p-3 bg-muted/20 rounded text-sm">
                  "{checkIn.response}"
                </div>
              )}
              
              {checkIn.completed_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Completed at {new Date(checkIn.completed_at).toLocaleTimeString()}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const completedDayClass = "border-2 border-green-500 rounded-full";
  const partialDayClass = "border-2 border-amber-500 rounded-full";
  const pendingDayClass = "border-2 border-dashed border-gray-300 rounded-full";

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1 mr-4"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <h1 className="text-2xl font-medium">Check-in Calendar</h1>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={(selectedDate) => selectedDate && setDate(selectedDate)}
                  className="rounded-md border"
                  modifiersClassNames={{
                    today: 'bg-primary/10 text-primary font-bold',
                    selected: 'bg-primary text-primary-foreground',
                    completed: completedDayClass,
                    partial: partialDayClass,
                    pending: pendingDayClass,
                  }}
                  modifiers={{
                    completed: (day) => getDayCompletionStatus(day) === 'completed',
                    partial: (day) => getDayCompletionStatus(day) === 'partial',
                    pending: (day) => getDayCompletionStatus(day) === 'pending' && !isToday(day),
                  }}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>
                  {format(date, 'PPPP')}
                  {isToday(date) && <span className="ml-2 text-sm text-primary">(Today)</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  renderCheckInsForSelectedDate()
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
