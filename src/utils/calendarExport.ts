
/**
 * Utility functions for exporting goals to calendar formats
 */

/**
 * Generates an iCalendar (.ics) file string for a goal
 * Compatible with Google Calendar, Apple Calendar, and other calendar apps
 */
export function generateICalendarForGoal(goal: {
  id: string;
  title: string;
  description?: string;
  type: string;
}) {
  // Format current date as YYYYMMDD'T'HHmmss'Z' (UTC format for iCalendar)
  const now = new Date();
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };
  
  // Calculate start and end dates based on goal type
  const startDate = new Date();
  const endDate = new Date();
  
  // Set different durations based on goal type
  switch (goal.type) {
    case "daily":
      // Daily goals repeat every day
      endDate.setDate(endDate.getDate() + 30); // End after 30 days by default
      break;
    case "weekly":
      // Weekly goals
      endDate.setDate(endDate.getDate() + 90); // End after ~3 months
      break;
    case "monthly":
      // Monthly goals
      endDate.setDate(endDate.getDate() + 180); // End after ~6 months
      break;
    default:
      endDate.setDate(endDate.getDate() + 30);
  }
  
  // Create unique identifier for the event
  const uid = `goal-${goal.id}-${Date.now()}@habitpal.app`;
  
  // Build the iCalendar content
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HabitPal//Goal Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatDate(now)}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(new Date(startDate.getTime() + 30 * 60000))}`, // 30 min event
    `SUMMARY:${goal.title}`,
    `DESCRIPTION:${goal.description || ""}`,
    "STATUS:CONFIRMED",
    `RRULE:FREQ=${goal.type.toUpperCase()};UNTIL=${formatDate(endDate)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder for your goal",
    "TRIGGER:-PT30M",  // 30 minutes before
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
  
  return icsContent;
}

/**
 * Downloads an iCalendar file for a goal
 */
export function downloadGoalAsICalendar(goal: {
  id: string;
  title: string;
  description?: string;
  type: string;
}) {
  const icsContent = generateICalendarForGoal(goal);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  // Create a link element and trigger a download
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${goal.title.replace(/\s+/g, "-")}-goal.ics`);
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a Google Calendar direct add URL
 * This allows users to add an event directly to their Google Calendar
 */
export function getGoogleCalendarUrl(goal: {
  title: string;
  description?: string;
  type: string;
}) {
  // Set dates based on goal type
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 30 * 60000); // 30 min event
  
  // Format for Google Calendar URL
  const formatGoogleDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, "");
  };
  
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: goal.title,
    details: goal.description || "",
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
    recur: `RRULE:FREQ=${goal.type.toUpperCase()}`
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
