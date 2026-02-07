"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "ADMIN";

  async function handleLogout() {
    // backend logout (brise cookie)
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => null);

    // frontend state (AuthProvider)
    await logout();

    router.push("/login");
  }

  return (
    <nav className="navbar">
      <div className="navbarInner">
        <div className="navLinks">
          <Link href="/" className="navLink">
            Home
          </Link>

          {/* Login/Register se vide samo kad user nije ulogovan */}
          {!user ? (
            <>
              <Link href="/login" className="navLink">
                Login
              </Link>
              <Link href="/register" className="navLink">
                Register
              </Link>
            </>
          ) : null}

          {user ? (
            <>
              <Link href="/attendance" className="navLink">
                Attendance
              </Link>

              <Link href="/calendar" className="navLink">
                Calendar
              </Link>

              {isAdmin ? (
                <Link href="/admin" className="navLink">
                  Admin
                </Link>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="navRight">
          {user ? (
            <>
              <span className="pill">
                {user.email} • <span className="role-badge">{user.role}</span>
              </span>

              <button className="btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <span className="muted">Not logged in</span>
          )}
        </div>
      </div>
    </nav>
  );
}
