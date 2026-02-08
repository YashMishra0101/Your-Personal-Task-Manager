import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  format,
  isSameDay,
} from "date-fns";

export function getRemainingTime(deadline, includeLastDay = true) {
  if (!deadline) return "";

  const now = new Date();
  const deadlineDate = new Date(deadline);

  if (deadlineDate < now) return "Overdue";

  // Calculate total difference in minutes for accuracy
  const totalMinutes = differenceInMinutes(deadlineDate, now);

  // Calculate days based on includeLastDay preference
  let days = Math.floor(totalMinutes / (24 * 60));
  if (includeLastDay) {
    days = days + 1;
  }

  // Special case: Last Day indicator (only when includeLastDay is true)
  if (days === 1 && includeLastDay) {
    return "LAST_DAY"; // Special marker for styling
  }

  // Display only days remaining
  if (days === 0) return "Due today";
  if (days === 1) return "1d left";

  return `${days}d left`;
}

export function formatDeadlineDisplay(deadline) {
  if (!deadline) return "";
  return format(new Date(deadline), "EEE, MMM d");
}

export function isCreatedToday(dateJson) {
  if (!dateJson) return false;
  // Handle Firestore Timestamp or string
  const date = dateJson.toDate ? dateJson.toDate() : new Date(dateJson);
  return isSameDay(date, new Date());
}

/**
 * Convert 24-hour time format to 12-hour format with AM/PM
 * @param {string} time24 - Time in HH:MM format (24-hour)
 * @returns {string} - Time in h:MM AM/PM format (12-hour)
 */
export function format12Hour(time24) {
  if (!time24 || typeof time24 !== 'string') {
    return time24;
  }

  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const minute = minutes || '00';

  if (isNaN(hour)) {
    return time24;
  }

  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  return `${hour12}:${minute} ${period}`;
}

/**
 * Get current time in 24-hour format for input fields
 * @returns {string} - Current time in HH:MM format
 */
export function getCurrentTime24() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
