"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "ADMIN";

  return (
    <nav className="navbar">
      <div className="navbarInner">
        <div className="navLinks">
          <Link href="/" className="navLink">
            Home
          </Link>

          <Link href="/login" className="navLink">
            Login
          </Link>

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
        </div>

        <div className="navRight">
          {user ? (
            <>
              <span className="pill">
                {user.email} • <span className="role-badge">{user.role}</span>
              </span>

              <button
                className="btn"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
              >
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
