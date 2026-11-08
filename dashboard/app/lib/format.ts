import { format, parseISO, differenceInCalendarDays, isSameMonth } from "date-fns";

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
export const formatDays = (n: number) => plural(n, "day");

/** "Mon 9 Nov", "Mon 9 – Wed 11 Nov" or "28 Nov – 2 Dec" from two ISO dates. */
export function formatDateRange(start: string, end: string): string {
  const s = parseISO(start);
  const e = parseISO(end);
  if (start === end) return format(s, "EEE d MMM");
  if (isSameMonth(s, e)) return `${format(s, "EEE d")} – ${format(e, "EEE d MMM")}`;
  return `${format(s, "d MMM")} – ${format(e, "d MMM")}`;
}

export const leaveTypeLabel = (type: string) => `${type.charAt(0).toUpperCase()}${type.slice(1)} leave`;

export const initials = (name?: string) =>
  (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");

/** "today", "tomorrow", "in 5 days" or "already started", relative to today. */
export function startsIn(start: string): string {
  const n = differenceInCalendarDays(parseISO(start), new Date());
  if (n < 0) return "already started";
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  return `in ${n} days`;
}

/** ISO date strings (yyyy-mm-dd) compare correctly as text. */
export const rangesOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
  aStart <= bEnd && bStart <= aEnd;

export const formatTimestamp = (iso: string) => format(parseISO(iso), "d MMM, HH:mm");
