import type { AttendanceRecord } from "@/lib/types";

const KEY = "attendance_records_v1";

function todayISO() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}
function timeHHMM() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
function uid() {
  return `att_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function getAllAttendance(): AttendanceRecord[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AttendanceRecord[];
  } catch {
    return [];
  }
}

export function saveAllAttendance(records: AttendanceRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(records));
}

export function getAttendanceForUser(email: string) {
  return getAllAttendance()
    .filter((r) => r.userEmail === email)
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
}

export function getTodayRecord(email: string) {
  const date = todayISO();
  return getAllAttendance().find(
    (r) => r.userEmail === email && r.date === date
  );
}

export function checkIn(email: string) {
  const date = todayISO();
  const records = getAllAttendance();
  const existing = records.find(
    (r) => r.userEmail === email && r.date === date
  );

  if (existing?.checkInAt) return records; // već evidentiran dolazak

  const now = timeHHMM();

  const next = existing
    ? records.map((r) => (r === existing ? { ...r, checkInAt: now } : r))
    : [{ id: uid(), userEmail: email, date, checkInAt: now }, ...records];

  saveAllAttendance(next);
  return next;
}

export function checkOut(email: string) {
  const date = todayISO();
  const records = getAllAttendance();
  const existing = records.find(
    (r) => r.userEmail === email && r.date === date
  );

  if (!existing?.checkInAt) return records; // ne može odlazak bez dolaska
  if (existing.checkOutAt) return records; // već evidentiran odlazak

  const now = timeHHMM();
  const next = records.map((r) =>
    r === existing ? { ...r, checkOutAt: now } : r
  );
  saveAllAttendance(next);
  return next;
}
