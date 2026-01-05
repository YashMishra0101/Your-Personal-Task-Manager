import { differenceInDays, intervalToDuration, addDays } from "date-fns";

function getDetailedTimeLeft(nowStr, deadlineStr) {
  const now = new Date(nowStr);
  const end = new Date(deadlineStr);

  console.log(`\nNow: ${nowStr}`);
  console.log(`End: ${deadlineStr}`);

  const days = differenceInDays(end, now);

  // add days to start to get the remainder duration
  const daysAdded = addDays(now, days);

  // Get the duration for the remainder
  const duration = intervalToDuration({
    start: daysAdded,
    end: end,
  });

  const hours = duration.hours || 0;
  const minutes = duration.minutes || 0;

  console.log(`Result: ${days} Days, ${hours} Hours, ${minutes} Minutes`);
}

// User Case 1: 5th 00:00 -> 8th 03:00
getDetailedTimeLeft("2026-01-05T00:00:00", "2026-01-08T03:00:00");

// User Case 2: 5th 15:00 -> 8th 12:00 (Less than full 3 days)
getDetailedTimeLeft("2026-01-05T15:00:00", "2026-01-08T12:00:00");

// User Case 3: 5th 12:00 -> 5th 15:00 (Same day)
getDetailedTimeLeft("2026-01-05T12:00:00", "2026-01-05T15:00:00");
