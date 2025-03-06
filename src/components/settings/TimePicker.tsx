
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  label?: string;
  className?: string;
}

export function TimePickerDemo({
  date,
  setDate,
  label,
  className,
}: TimePickerProps) {
  const minuteRef = React.useRef<HTMLInputElement>(null);
  const hourRef = React.useRef<HTMLInputElement>(null);
  const [hour, setHour] = React.useState<string>(
    date ? date.getHours().toString().padStart(2, "0") : ""
  );
  const [minute, setMinute] = React.useState<string>(
    date ? date.getMinutes().toString().padStart(2, "0") : ""
  );

  // Update hour and minute when date changes
  React.useEffect(() => {
    if (date) {
      setHour(date.getHours().toString().padStart(2, "0"));
      setMinute(date.getMinutes().toString().padStart(2, "0"));
    }
  }, [date]);

  // Update date when hour or minute changes
  const updateDate = (newHour: number, newMinute: number) => {
    const newDate = new Date();
    newDate.setHours(newHour);
    newDate.setMinutes(newMinute);
    setDate(newDate);
  };

  // Handle hour change
  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const valueAsNumber = parseInt(value);

    if (value.length > 2) return;
    if (isNaN(valueAsNumber) && value !== "") return;
    if (valueAsNumber > 23) return;

    setHour(value);
    if (value.length === 2) {
      minuteRef.current?.focus();
      minuteRef.current?.select();
    }

    if (value === "") return;
    if (minute === "") return;
    updateDate(valueAsNumber, parseInt(minute));
  };

  // Handle minute change
  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const valueAsNumber = parseInt(value);

    if (value.length > 2) return;
    if (isNaN(valueAsNumber) && value !== "") return;
    if (valueAsNumber > 59) return;

    setMinute(value);
    if (value.length === 2) {
      minuteRef.current?.blur();
    }

    if (value === "") return;
    if (hour === "") return;
    updateDate(parseInt(hour), valueAsNumber);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <Label>{label}</Label>}
      <div className="flex gap-2 items-center">
        <Input
          ref={hourRef}
          value={hour}
          onChange={handleHourChange}
          className="w-14"
          placeholder="HH"
        />
        <span className="text-lg">:</span>
        <Input
          ref={minuteRef}
          value={minute}
          onChange={handleMinuteChange}
          className="w-14"
          placeholder="MM"
        />
      </div>
    </div>
  );
}
