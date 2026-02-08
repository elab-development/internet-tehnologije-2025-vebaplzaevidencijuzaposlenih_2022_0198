export type UserRole = "EMPLOYEE" | "MANAGER" | "ADMIN";

export type CurrentUser = {
  email: string;
  role: UserRole;
};
export type AttendanceRecord = {
  id: number | null;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  status: "PRESENT" | "LATE" | "ABSENT";
};
