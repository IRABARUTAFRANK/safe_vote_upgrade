/**
 * Convert datetime-local input string to UTC Date
 * datetime-local inputs send time without timezone, so we need to treat it as local time
 * then convert to UTC for storage
 */
export function parseLocalDateTime(dateString: string): Date {
  if (!dateString) return new Date();
  
  // Parse the datetime-local format (YYYY-MM-DDTHH:mm)
  const d = new Date(dateString);
  
  // The Date constructor interprets datetime-local strings as UTC
  // To get the correct local time interpretation:
  // We need to adjust by the timezone offset
  const tzOffset = d.getTimezoneOffset() * 60 * 1000; // Convert to milliseconds
  
  // Create a new date with the offset adjusted
  return new Date(d.getTime() + tzOffset);
}

/**
 * Format a UTC date for display in user's local timezone
 */
export function formatDateAsLocal(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a UTC date for datetime-local input field
 * Returns string in format YYYY-MM-DDTHH:mm
 */
export function formatDateForDatetimeLocal(date: Date | string | null): string {
  if (!date) return "";
  
  const d = new Date(date);
  
  // Get the user's timezone offset
  const tzOffset = d.getTimezoneOffset();
  
  // Adjust the date to local time
  const localDate = new Date(d.getTime() - tzOffset * 60 * 1000);
  
  // Format as YYYY-MM-DDTHH:mm
  return localDate.toISOString().slice(0, 16);
}
