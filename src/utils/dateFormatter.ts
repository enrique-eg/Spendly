/**
 * Formats a date/timestamp string to a readable date-time format without timezone
 * @param dateString ISO date string or timestamp (e.g., "2024-04-09T10:30:00+00:00" or "2024-04-09")
 * @returns Formatted date-time string without timezone (e.g., "09/04/2024 10:30")
 */
export function formatDateWithoutTimezone(dateString?: string | null): string {
  if (!dateString) return '—';
  
  try {
    const date = new Date(dateString);
    
    // Check if it's a valid date
    if (isNaN(date.getTime())) return '—';
    
    // Format: DD/MM/YYYY HH:mm (without timezone)
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return '—';
  }
}

/**
 * Formats a date string to only show the date without time or timezone
 * @param dateString ISO date string or timestamp
 * @returns Formatted date string (e.g., "09/04/2024")
 */
export function formatDateOnly(dateString?: string | null): string {
  if (!dateString) return '—';
  
  try {
    const date = new Date(dateString);
    
    // Check if it's a valid date
    if (isNaN(date.getTime())) return '—';
    
    // Format: DD/MM/YYYY
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch {
    return '—';
  }
}
