
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardHeaderProps {
  profile: any;
  formattedDate: string;
  handleCalendarClick: () => void;
}

const DashboardHeader = ({ profile, formattedDate, handleCalendarClick }: DashboardHeaderProps) => {
  return (
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
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={handleCalendarClick}
          >
            <Calendar className="h-4 w-4" /> Calendar
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
