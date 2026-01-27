import type { CurrentUser } from "@/lib/types";

const KEY = "current_user";

export function setCurrentUser(user: CurrentUser) {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function getCurrentUser(): CurrentUser | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

export function clearCurrentUser() {
  localStorage.removeItem(KEY);
}
