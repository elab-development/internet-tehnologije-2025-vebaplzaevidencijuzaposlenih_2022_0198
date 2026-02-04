export type Role = "EMPLOYEE" | "MANAGER" | "ADMIN";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: number;
};

const KEY = "attendance_admin_users_v1";

function seed(): AdminUser[] {
  return [
    {
      id: "u1",
      name: "Demo Admin",
      email: "admin@demo.com",
      role: "ADMIN",
      active: true,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    },
    {
      id: "u2",
      name: "Demo Manager",
      email: "manager@demo.com",
      role: "MANAGER",
      active: true,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    },
    {
      id: "u3",
      name: "Demo Employee",
      email: "employee@demo.com",
      role: "EMPLOYEE",
      active: true,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    },
  ];
}

export function getUsers(): AdminUser[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const s = seed();
    localStorage.setItem(KEY, JSON.stringify(s));
    return s;
  }
  try {
    return JSON.parse(raw) as AdminUser[];
  } catch {
    const s = seed();
    localStorage.setItem(KEY, JSON.stringify(s));
    return s;
  }
}

export function saveUsers(users: AdminUser[]) {
  localStorage.setItem(KEY, JSON.stringify(users));
}

export function updateUser(id: string, patch: Partial<AdminUser>) {
  const users = getUsers();
  const next = users.map(u => (u.id === id ? { ...u, ...patch } : u));
  saveUsers(next);
  return next;
}

export function upsertUser(user: AdminUser) {
  const users = getUsers();
  const exists = users.some(u => u.id === user.id);
  const next = exists ? users.map(u => (u.id === user.id ? user : u)) : [user, ...users];
  saveUsers(next);
  return next;
}
