import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Moves an "HH:mm" end time so the duration stays the same when the start changes. */
export function shiftEndTime(oldStart: string, newStart: string, end: string): string {
  const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  if (!/^\d{2}:\d{2}$/.test(oldStart) || !/^\d{2}:\d{2}$/.test(newStart) || !/^\d{2}:\d{2}$/.test(end)) return end;
  const duration = Math.max(toMin(end) - toMin(oldStart), 15);
  const next = Math.min(toMin(newStart) + duration, 23 * 60 + 59);
  return `${String(Math.floor(next / 60)).padStart(2, "0")}:${String(next % 60).padStart(2, "0")}`;
}
