"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "ADMIN";

  return (
    <nav style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link href="/">Home</Link>
        {" | "}
        <Link href="/login">Login</Link>
        {" | "}
        <Link href="/calendar">Calendar</Link>
        {isAdmin ? (
          <>
            {" | "}
            <Link href="/admin">Admin</Link>
          </>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {user ? (
          <>
            <span className="pill">
              {user.email} • <strong>{user.role}</strong>
            </span>
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              style={{
                border: "1px solid #333",
                background: "#0b0b0b",
                color: "inherit",
                borderRadius: 10,
                padding: "6px 10px",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <span className="muted">Not logged in</span>
        )}
      </div>
    </nav>
  );
}
