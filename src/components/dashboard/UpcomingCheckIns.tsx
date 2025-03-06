
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import MorningPlanning from "./MorningPlanning";
import EveningReflection from "./EveningReflection";

const UpcomingCheckIns = () => {
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [selectedCheckIn, setSelectedCheckIn] = useState<string | null>(null);
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    
    const fetchCheckIns = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', user.id)
        .eq('check_in_date', today);
          
      if (error) {
        console.error("Error fetching check-ins:", error);
        return;
      }
      
      setCheckIns(data || []);
    };
    
    fetchCheckIns();
  }, [user]);

  const getUpcomingCheckIns = () => {
    const currentHour = new Date().getHours();
    const upcomingCheckIns = [];
    
    const morningCheckIn = checkIns.find(c => c.check_in_type === 'morning');
    const eveningCheckIn = checkIns.find(c => c.check_in_type === 'evening');
    
    if (currentHour < 12) {
      if (!morningCheckIn || !morningCheckIn.completed) {
        upcomingCheckIns.push({
          id: 'morning',
          title: 'Morning Planning',
          time: 'Today at 8:00 AM',
          active: true
        });
      }
      
      upcomingCheckIns.push({
        id: 'evening',
        title: 'Evening Reflection',
        time: 'Today at 8:00 PM',
        active: false
      });
    } 
    else if (currentHour < 18) {
      if (!eveningCheckIn || !eveningCheckIn.completed) {
        upcomingCheckIns.push({
          id: 'evening',
          title: 'Evening Reflection',
          time: 'Today at 8:00 PM',
          active: true
        });
      }
      
      upcomingCheckIns.push({
        id: 'morning',
        title: 'Morning Planning',
        time: 'Tomorrow at 8:00 AM',
        active: false
      });
    } 
    else {
      if (!eveningCheckIn || !eveningCheckIn.completed) {
        upcomingCheckIns.push({
          id: 'evening',
          title: 'Evening Reflection',
          time: 'Today at 8:00 PM',
          active: true
        });
      }
      
      upcomingCheckIns.push({
        id: 'morning',
        title: 'Morning Planning',
        time: 'Tomorrow at 8:00 AM',
        active: false
      });
    }
    
    return upcomingCheckIns;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Upcoming Check-ins</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {selectedCheckIn ? (
          <div className="space-y-4">
            {selectedCheckIn === 'morning' ? (
              <MorningPlanning />
            ) : (
              <EveningReflection />
            )}
            <Button 
              variant="outline" 
              className="w-full mt-2"
              onClick={() => setSelectedCheckIn(null)}
            >
              Back to Check-ins
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {getUpcomingCheckIns().map((checkIn) => (
              <div
                key={checkIn.id}
                className={`flex items-center justify-between p-3 border rounded-md ${
                  checkIn.active ? 'bg-primary/5 border-primary/20' : ''
                }`}
              >
                <div>
                  <p className="font-medium">
                    {checkIn.title}
                    {checkIn.active && (
                      <Badge variant="outline" className="ml-2 text-xs bg-primary/10">
                        Due soon
                      </Badge>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {checkIn.time}
                  </p>
                </div>
                <Button
                  variant={checkIn.active ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8 px-3"
                  onClick={() => setSelectedCheckIn(checkIn.id)}
                >
                  {checkIn.active ? "Start" : "Reminder"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingCheckIns;
