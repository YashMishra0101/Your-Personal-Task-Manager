import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  format,
  isSameDay,
} from "date-fns";

export function getRemainingTime(deadline) {
  if (!deadline) return "";

  const now = new Date();
  const deadlineDate = new Date(deadline);

  if (deadlineDate < now) return "Overdue";

  // Calculate total difference in minutes for accuracy
  const totalMinutes = differenceInMinutes(deadlineDate, now);

  // Calculate days, hours, and remaining minutes
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  // Display logic
  if (days === 0 && hours === 0 && minutes === 0) return "Due now";
  if (days === 0 && hours === 0) return `${minutes}m left`;
  if (days === 0) return `${hours}h ${minutes}m left`;

  return `${days}d ${hours}h left`;
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
