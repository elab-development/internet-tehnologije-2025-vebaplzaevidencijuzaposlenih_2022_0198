"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CurrentUser } from "@/lib/types";
import { clearCurrentUser, getCurrentUser, setCurrentUser } from "@/lib/auth";

type AuthCtx = {
  user: CurrentUser | null;
  login: (u: CurrentUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const value = useMemo<AuthCtx>(() => {
    return {
      user,
      login: (u) => {
        setCurrentUser(u);
        setUser(u);
      },
      logout: () => {
        clearCurrentUser();
        setUser(null);
      },
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
}
