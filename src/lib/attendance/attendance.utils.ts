export function isLateAfter14Local(now: Date) {
  const hh = now.getHours();
  const mm = now.getMinutes();
  return hh > 14 || (hh === 14 && mm > 0);
}

// src/lib/ui/attendance.ts
import type { AttendanceRecord } from "@/lib/types/types";

export function attendanceBadgeClass(
  status: AttendanceRecord["status"] | string
): string {
  if (status === "PRESENT") return "badge badge-present";
  if (status === "LATE") return "badge badge-late";
  return "badge badge-absent";
}
