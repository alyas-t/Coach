
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useCoachSettings } from "@/hooks/useCoachSettings";
import PageTransition from "@/components/layout/PageTransition";
import Header from "@/components/layout/Header";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { 
  Moon, 
  Sun, 
  Save, 
  Loader2, 
  UserCog, 
  MessageSquare, 
  Bell, 
  Calendar 
} from "lucide-react";
import { TimePickerDemo } from "@/components/settings/TimePicker";

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { saveCoachSettings, getCoachSettings, isLoading: isCoachSettingsLoading } = useCoachSettings();
  
  const [coachStyle, setCoachStyle] = useState("supportive");
  const [coachTone, setCoachTone] = useState("friendly");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTab, setSelectedTab] = useState("coach");
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [morningTime, setMorningTime] = useState("08:00");
  const [eveningTime, setEveningTime] = useState("20:00");
  const [notificationSaving, setNotificationSaving] = useState(false);
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    const loadSettings = async () => {
      const settings = await getCoachSettings();
      if (settings) {
        setCoachStyle(settings.coach_style || "supportive");
        setCoachTone(settings.coach_tone || "friendly");
        
        // Load notification times if available
        if (settings.morning_time) setMorningTime(settings.morning_time);
        if (settings.evening_time) setEveningTime(settings.evening_time);
      }
    };
    
    loadSettings();
  }, [user, navigate, getCoachSettings]);
  
  const handleSaveCoachSettings = async () => {
    setIsSaving(true);
    try {
      await saveCoachSettings({
        coachStyle,
        coachTone
      });
      toast.success("Coach settings saved successfully");
    } catch (error) {
      toast.error("Failed to save coach settings");
    } finally {
      setIsSaving(false);
    }
  };

  const saveNotificationSettings = async () => {
    setNotificationSaving(true);
    try {
      await saveCoachSettings({
        coachStyle,
        coachTone,
        morningTime,
        eveningTime
      });
      
      // Schedule notifications for the selected times
      scheduleDailyNotification("morning", morningTime, "Time for your Morning Planning!");
      scheduleDailyNotification("evening", eveningTime, "Time for your Evening Reflection!");
      
      toast.success("Notification settings saved");
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast.error("Failed to save notification settings");
    } finally {
      setNotificationSaving(false);
    }
  };
  
  const scheduleDailyNotification = (type, time, message) => {
    // Only attempt to schedule if browser supports notifications
    if (window.Notification && Notification.permission === "granted") {
      const [hours, minutes] = time.split(':').map(Number);
      
      // Calculate when to send the notification
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);
      
      // If time has already passed today, schedule for tomorrow
      if (scheduledTime < now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      const timeUntilNotification = scheduledTime.getTime() - now.getTime();
      
      // Store the timeout ID in localStorage to be able to clear it later
      const existingTimeoutId = localStorage.getItem(`${type}_notification_timeout`);
      if (existingTimeoutId) {
        clearTimeout(parseInt(existingTimeoutId));
      }
      
      const timeoutId = setTimeout(() => {
        new Notification("Check-in Reminder", {
          body: message,
          icon: "/favicon.ico"
        });
        
        // Schedule next day's notification
        scheduleDailyNotification(type, time, message);
      }, timeUntilNotification);
      
      localStorage.setItem(`${type}_notification_timeout`, timeoutId.toString());
      console.log(`Scheduled ${type} notification for ${scheduledTime.toLocaleString()}`);
    } else if (window.Notification && Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          scheduleDailyNotification(type, time, message);
        }
      });
    }
  };
  
  if (!user) return null;
  
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-medium tracking-tight">Settings</h1>
              <p className="text-muted-foreground">
                Customize your experience and preferences
              </p>
            </div>
            
            <Tabs defaultValue={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="coach" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>AI Coach</span>
                </TabsTrigger>
                <TabsTrigger value="preferences" className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  <span>Preferences</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span>Notifications</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="coach" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Coach Settings</CardTitle>
                    <CardDescription>
                      Customize how your AI coach interacts with you
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="coachStyle">Coaching Style</Label>
                      <Select value={coachStyle} onValueChange={setCoachStyle}>
                        <SelectTrigger id="coachStyle">
                          <SelectValue placeholder="Select coaching style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="supportive">Supportive</SelectItem>
                          <SelectItem value="directive">Directive</SelectItem>
                          <SelectItem value="challenging">Challenging</SelectItem>
                          <SelectItem value="analytical">Analytical</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        {coachStyle === "supportive" && "Focuses on encouragement and emotional support"}
                        {coachStyle === "directive" && "Provides clear instructions and structured guidance"}
                        {coachStyle === "challenging" && "Pushes you outside your comfort zone to achieve more"}
                        {coachStyle === "analytical" && "Uses data and logical reasoning to guide decisions"}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="coachTone">Communication Tone</Label>
                      <Select value={coachTone} onValueChange={setCoachTone}>
                        <SelectTrigger id="coachTone">
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="friendly">Friendly & Conversational</SelectItem>
                          <SelectItem value="professional">Professional & Formal</SelectItem>
                          <SelectItem value="motivational">Motivational & Energetic</SelectItem>
                          <SelectItem value="direct">Direct & Concise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={handleSaveCoachSettings} disabled={isSaving || isCoachSettingsLoading}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="preferences" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                      Customize the look and feel of the application
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="dark-mode">Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Switch between light and dark theme
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4 text-muted-foreground" />
                        <Switch 
                          id="dark-mode"
                          checked={theme === "dark"}
                          onCheckedChange={toggleTheme}
                        />
                        <Moon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="notifications" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Check-in Times</CardTitle>
                    <CardDescription>
                      Customize when you'd like to receive your daily check-ins
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="morning-time">Morning Planning Time</Label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="morning-time"
                            type="time"
                            value={morningTime}
                            onChange={(e) => setMorningTime(e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="evening-time">Evening Reflection Time</Label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="evening-time"
                            type="time"
                            value={eveningTime}
                            onChange={(e) => setEveningTime(e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={saveNotificationSettings} disabled={notificationSaving}>
                      {notificationSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Bell className="mr-2 h-4 w-4" />
                          Save & Schedule Reminders
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>
                      Control how and when you receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive reminders and updates via email
                        </p>
                      </div>
                      <Switch 
                        id="email-notifications"
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="push-notifications">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive browser notifications
                        </p>
                      </div>
                      <Switch 
                        id="push-notifications"
                        checked={pushNotifications}
                        onCheckedChange={setPushNotifications}
                        onClick={() => {
                          if (window.Notification && Notification.permission !== "granted") {
                            Notification.requestPermission();
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={saveNotificationSettings} disabled={notificationSaving}>
                      {notificationSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Notification Settings
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default Settings;
