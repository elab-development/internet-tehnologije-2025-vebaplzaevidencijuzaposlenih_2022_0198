import type { AttendanceRecord } from "@/lib/types/types";
import { isoToHHMM } from "@/lib/date/format";

export function mapAttendanceApiItemToRecord(a: any): AttendanceRecord {
  return {
    id: a.id,
    date: a.date,
    checkInAt: a.startTime ? isoToHHMM(a.startTime) : null,
    checkOutAt: a.endTime ? isoToHHMM(a.endTime) : null,
    status: a.status,
  };
}
