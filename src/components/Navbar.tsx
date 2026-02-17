"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { usePathname } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "ADMIN";
  const isEmployee = user?.role === "EMPLOYEE";
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => null);

    await logout();

    router.push("/login");
  }

  return (
    <nav className="navbar" style={{ borderBottom: "1px solid #d7dbe2", boxShadow: "0 1px 0 rgba(255,255,255,0.06)" }}>
      <div className="navbarInner" style={{ padding: "16px 0" }}>
        <div className="navLinks">
          <Link
            href="/"
            className={`navLink ${
              pathname === "/" ? "navLink--active" : ""
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
              {isEmployee ? (
                <Link
                  href="/my-requests"
                  className={`navLink ${
                    pathname === "/my-requests" ? "navLink--active" : ""
                  }`}
                >
                  Moji zahtevi
                </Link>
              ) : null}

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
              <div className="flex items-center gap-2">
                <UserAvatar email={user.email} size={36} />
                <span className="pill">
                  {user.email} • <span className="role-badge">{user.role}</span>
                </span>
              </div>

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
