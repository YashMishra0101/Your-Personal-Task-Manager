import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  parseISO,
} from "date-fns";

const now = new Date("2026-01-05T00:00:00"); // User's example "current time is 12:00 AM" (assuming midnight)
const deadline = new Date("2026-01-08T03:00:00"); // "deadline as the 8th with a time of 3:00 AM"

console.log("Now:", now.toString());
console.log("Deadline:", deadline.toString());

const days = differenceInDays(deadline, now);
const hours = differenceInHours(deadline, now) % 24;
const minutes = differenceInMinutes(deadline, now) % 60;

console.log(`Days: ${days}`);
console.log(`Hours: ${hours}`);
console.log(`Minutes: ${minutes}`);

// Case 2: The screenshot case?
// If display is 13 Days, 16h 59m.
const now2 = new Date("2026-01-05T12:02:00");
// Add 13 days 16h 59m
const target2 = new Date(
  now2.getTime() + 13 * 24 * 3600 * 1000 + 16 * 3600 * 1000 + 59 * 60 * 1000
);
console.log("Calculated Target for Case 2:", target2.toString());
