export type UserRole = "EMPLOYEE" | "MANAGER" | "ADMIN";

export type CurrentUser = {
  email: string;
  role: UserRole;
};