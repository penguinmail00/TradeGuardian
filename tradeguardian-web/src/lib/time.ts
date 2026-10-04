const units = [
  { seconds: 365 * 24 * 60 * 60, singular: "yr", plural: "yrs" },
  { seconds: 24 * 60 * 60, singular: "day", plural: "days" },
  { seconds: 60 * 60, singular: "hr", plural: "hrs" },
  { seconds: 60, singular: "min", plural: "mins" },
  { seconds: 1, singular: "sec", plural: "secs" },
] as const;

/**
 * Etherscan-style age using up to `maxUnits` of the largest units: "45 secs
 * ago", "3 hrs 12 mins ago", "2 days 3 hrs ago", or with one unit "34 days ago".
 */
export function formatAge(fromMs: number, nowMs: number, maxUnits = 2) {
  let remaining = Math.max(0, Math.floor((nowMs - fromMs) / 1000));
  const parts: string[] = [];

  for (const unit of units) {
    const count = Math.floor(remaining / unit.seconds);
    if (count > 0 || (parts.length === 0 && unit.seconds === 1)) {
      parts.push(`${count} ${count === 1 ? unit.singular : unit.plural}`);
      remaining -= count * unit.seconds;
    } else if (parts.length > 0) {
      // Units must be adjacent: "1 day 5 mins" would read as nearly exact.
      break;
    }
    if (parts.length === maxUnits) break;
  }

  return `${parts.join(" ")} ago`;
}

/** The three timestamp formats in Etherscan's dropdown. */
export type TimestampFormat = "utc" | "local" | "unix";

/**
 * Etherscan-style timestamps:
 * - utc:   "Aug-30-2026 03:40:47 AM +UTC"
 * - local: "Aug-29-2026 08:40:47 PM UTC-07" (the runtime's time zone)
 * - unix:  "1788061247"
 */
export function formatTimestamp(date: Date, format: TimestampFormat) {
  if (format === "unix") return String(Math.floor(date.getTime() / 1000));

  const isUtc = format === "utc";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: isUtc ? "UTC" : undefined,
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  const zone = isUtc ? "+UTC" : formatUtcOffset(date);

  return `${parts.month}-${parts.day}-${parts.year} ${parts.hour}:${parts.minute}:${parts.second} ${parts.dayPeriod} ${zone}`;
}

/** "UTC-07", "UTC+05:30", "UTC+00" for the runtime's zone on that date (DST-aware). */
function formatUtcOffset(date: Date) {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes < 0 ? "-" : "+";
  const hours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, "0");
  const minutes = Math.abs(offsetMinutes) % 60;
  return `UTC${sign}${hours}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""}`;
}
