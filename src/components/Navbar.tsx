"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "ADMIN";
  const pathname = usePathname();

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
          <Link
            href="/"
            className={`navLink ${
              pathname === "/home" ? "navLink--active" : ""
            }`}
          >
            Home
          </Link>

          {/* Login/Register se vide samo kad user nije ulogovan */}
          {!user ? (
            <>
              <Link
                href="/login"
                className={`navLink ${
                  pathname === "/login" ? "navLink--active" : ""
                }`}
              >
                Login
              </Link>
              <Link
                href="/register"
                className={`navLink ${
                  pathname === "/register" ? "navLink--active" : ""
                }`}
              >
                Register
              </Link>
            </>
          ) : null}

          {user ? (
            <>
              <Link
                href="/attendance"
                className={`navLink ${
                  pathname === "/attendance" ? "navLink--active" : ""
                }`}
              >
                Attendance
              </Link>

              <Link
                href="/calendar"
                className={`navLink ${
                  pathname === "/calendar" ? "navLink--active" : ""
                }`}
              >
                Calendar
              </Link>

              {isAdmin ? (
                <Link
                  href="/admin"
                  className={`navLink ${
                    pathname === "/admin" ? "navLink--active" : ""
                  }`}
                >
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
