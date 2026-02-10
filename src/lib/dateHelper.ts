/**
 * Convert datetime-local input string to UTC Date
 * datetime-local inputs send time without timezone, so we need to treat it as local time
 * then convert to UTC for storage
 * 
 * @param dateString - datetime-local string (e.g., "2026-02-10T18:33")
 * @param clientOffsetMinutes - client's timezone offset in minutes (optional, will use server offset if not provided)
 */
export function parseLocalDateTime(dateString: string, clientOffsetMinutes?: number): Date {
  if (!dateString) return new Date();
  
  // Parse the datetime-local format (YYYY-MM-DDTHH:mm)
  // This creates a Date object, but the constructor interprets it in a timezone-dependent way
  const d = new Date(dateString);
  
  // If we don't have the client offset, we can't reliably convert
  // This should only happen if the offset wasn't sent from the client
  if (clientOffsetMinutes === undefined) {
    // Fallback: use server's offset (not ideal, but better than nothing)
    const tzOffset = d.getTimezoneOffset() * 60 * 1000;
    return new Date(d.getTime() + tzOffset);
  }
  
  // Use the client's offset (in minutes) to correctly interpret the datetime-local string
  // Convert offset from minutes to milliseconds
  const clientOffsetMs = clientOffsetMinutes * 60 * 1000;
  
  // The datetime-local string represents local time
  // To convert to UTC: local_time - offset = UTC
  // But JavaScript's Date constructor interprets the string as UTC
  // So we need to add the offset to get the correct UTC time
  return new Date(d.getTime() + clientOffsetMs);
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
