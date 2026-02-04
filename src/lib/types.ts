export type UserRole = "EMPLOYEE" | "MANAGER" | "ADMIN";

export type CurrentUser = {
  email: string;
  role: UserRole;
};
export type AttendanceRecord = {
  id: string;
  userEmail: string;
  date: string; // "YYYY-MM-DD"
  checkInAt?: string; // "HH:MM"
  checkOutAt?: string; // "HH:MM"
};
