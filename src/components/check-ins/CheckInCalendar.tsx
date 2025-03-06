
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { useCheckIns } from "@/hooks/useCheckIns";

const CheckInCalendar = () => {
  const [date, setDate] = useState<Date>(new Date());
  const { checkIns, isLoading } = useCheckIns(format(date, 'yyyy-MM'));

  const getDayStatus = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayCheckIns = checkIns?.filter(c => c.check_in_date === dateStr);
    
    if (!dayCheckIns?.length) return undefined;
    
    const allCompleted = dayCheckIns.every(c => c.completed);
    const someCompleted = dayCheckIns.some(c => c.completed);
    
    if (allCompleted) return "completed";
    if (someCompleted) return "partial";
    return "pending";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Check-in Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={(date) => date && setDate(date)}
          className="p-0"
          modifiers={{
            completed: (date) => getDayStatus(date) === "completed",
            partial: (date) => getDayStatus(date) === "partial",
            pending: (date) => getDayStatus(date) === "pending",
          }}
          modifiersClassNames={{
            completed: "bg-green-100 text-green-900 hover:bg-green-200",
            partial: "bg-yellow-100 text-yellow-900 hover:bg-yellow-200",
            pending: "bg-blue-100 text-blue-900 hover:bg-blue-200",
          }}
        />
      </CardContent>
    </Card>
  );
};

export default CheckInCalendar;
