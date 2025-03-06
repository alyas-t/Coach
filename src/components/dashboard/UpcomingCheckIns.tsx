import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MorningPlanning from "./MorningPlanning";
import EveningReflection from "./EveningReflection";

const UpcomingCheckIns = () => {
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [selectedCheckIn, setSelectedCheckIn] = useState<string | null>(null);
  const [userSettings, setUserSettings] = useState<any>({
    morningTime: "08:00",
    eveningTime: "20:00"
  });
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
    
    const fetchUserSettings = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('morning_time, evening_time')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error("Error fetching user settings:", error);
        return;
      }
      
      if (data) {
        setUserSettings({
          morningTime: data.morning_time || "08:00",
          eveningTime: data.evening_time || "20:00"
        });
      }
    };
    
    fetchCheckIns();
    fetchUserSettings();
  }, [user]);

  const getUpcomingCheckIns = () => {
    const currentHour = new Date().getHours();
    const currentMinutes = new Date().getMinutes();
    const upcomingCheckIns = [];
    
    const morningCheckIn = checkIns.find(c => c.check_in_type === 'morning');
    const eveningCheckIn = checkIns.find(c => c.check_in_type === 'evening');
    
    const isMorningCompleted = morningCheckIn && morningCheckIn.completed;
    const isEveningCompleted = eveningCheckIn && eveningCheckIn.completed;
    
    const [morningHour, morningMinute] = userSettings.morningTime.split(':').map(Number);
    const [eveningHour, eveningMinute] = userSettings.eveningTime.split(':').map(Number);
    
    const isPastMorningTime = 
      currentHour > morningHour || 
      (currentHour === morningHour && currentMinutes >= morningMinute);
      
    const isPastEveningTime = 
      currentHour > eveningHour || 
      (currentHour === eveningHour && currentMinutes >= eveningMinute);
    
    if (!isMorningCompleted && (!isPastEveningTime)) {
      upcomingCheckIns.push({
        id: 'morning',
        title: 'Morning Planning',
        time: `Today at ${userSettings.morningTime}`,
        active: isPastMorningTime
      });
    }
    
    if (!isEveningCompleted) {
      upcomingCheckIns.push({
        id: 'evening',
        title: 'Evening Reflection',
        time: `Today at ${userSettings.eveningTime}`,
        active: isPastMorningTime && isPastEveningTime
      });
    }
    
    if (upcomingCheckIns.length === 0) {
      upcomingCheckIns.push({
        id: 'morning',
        title: 'Morning Planning',
        time: `Tomorrow at ${userSettings.morningTime}`,
        active: false
      });
    }
    
    return upcomingCheckIns;
  };

  const scheduleReminder = (checkInType, time) => {
    if (window.Notification && Notification.permission !== "granted") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          setupReminder(checkInType, time);
        } else {
          toast.error("Notification permission denied");
        }
      });
    } else if (window.Notification) {
      setupReminder(checkInType, time);
    } else {
      toast.error("Your browser doesn't support notifications");
    }
  };
  
  const setupReminder = (checkInType, time) => {
    const [hours, minutes] = time.split(' at ')[1].split(':').map(Number);
    
    const now = new Date();
    const notificationTime = new Date();
    
    if (time.includes('Tomorrow')) {
      notificationTime.setDate(notificationTime.getDate() + 1);
    }
    
    notificationTime.setHours(hours, minutes, 0, 0);
    
    if (notificationTime < now && !time.includes('Tomorrow')) {
      toast.error("Can't set reminder for a time that has already passed");
      return;
    }
    
    const timeUntilNotification = notificationTime.getTime() - now.getTime();
    
    const existingReminderId = localStorage.getItem(`${checkInType}_reminder`);
    if (existingReminderId) {
      clearTimeout(parseInt(existingReminderId));
    }
    
    const reminderId = setTimeout(() => {
      new Notification("Check-in Reminder", {
        body: checkInType === 'morning' 
          ? "Time for your Morning Planning!" 
          : "Time for your Evening Reflection!",
        icon: "/favicon.ico"
      });
    }, timeUntilNotification);
    
    localStorage.setItem(`${checkInType}_reminder`, reminderId.toString());
    
    const formattedTime = notificationTime.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    toast.success(`Reminder set for ${formattedTime}`);
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 px-3"
                    onClick={() => scheduleReminder(checkIn.id, checkIn.time)}
                  >
                    <Bell className="h-3 w-3 mr-1" />
                    Reminder
                  </Button>
                  <Button
                    variant={checkIn.active ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-8 px-3"
                    onClick={() => setSelectedCheckIn(checkIn.id)}
                  >
                    {checkIn.active ? "Start" : "Preview"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingCheckIns;
