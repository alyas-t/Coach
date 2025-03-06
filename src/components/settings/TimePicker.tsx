
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  time: string;
  setTime: (time: string) => void;
  label?: string;
  className?: string;
  id?: string; // Add id prop to allow passing IDs for accessibility
}

export function TimePicker({
  time,
  setTime,
  label,
  className,
  id,
}: TimePickerProps) {
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <Label>{label}</Label>}
      <div className="flex gap-2 items-center">
        <Input
          type="time"
          value={time}
          onChange={handleTimeChange}
          className="w-full"
          id={id}
        />
      </div>
    </div>
  );
}
