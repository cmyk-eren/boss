import {
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";

export type DashboardRange = "today" | "7d" | "month" | "30d";

export const RANGE_OPTIONS: Array<{ value: DashboardRange; label: string }> = [
  { value: "today", label: "Bugün" },
  { value: "7d", label: "Son 7 Gün" },
  { value: "month", label: "Bu Ay" },
  { value: "30d", label: "Son 30 Gün" },
];

export function parseRange(input?: string): DashboardRange {
  if (input === "today" || input === "7d" || input === "month" || input === "30d") {
    return input;
  }

  return "7d";
}

export function resolveDateRange(range: DashboardRange) {
  const now = new Date();

  switch (range) {
    case "today":
      return {
        range,
        label: "Bugün",
        start: startOfDay(now),
        end: endOfDay(now),
        bucket: "hour" as const,
      };
    case "month":
      return {
        range,
        label: "Bu Ay",
        start: startOfMonth(now),
        end: endOfMonth(now),
        bucket: "day" as const,
      };
    case "30d":
      return {
        range,
        label: "Son 30 Gün",
        start: startOfDay(subDays(now, 29)),
        end: endOfDay(now),
        bucket: "day" as const,
      };
    case "7d":
    default:
      return {
        range,
        label: "Son 7 Gün",
        start: startOfDay(subDays(now, 6)),
        end: endOfDay(now),
        bucket: "day" as const,
      };
  }
}

export function formatBucketLabel(date: Date, bucket: "hour" | "day") {
  return bucket === "hour" ? format(date, "HH:mm") : format(date, "dd MMM");
}
