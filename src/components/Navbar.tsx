import Link from "next/link";

export default function Navbar() {
  return (
    <nav style={{ marginBottom: 16 }}>
      <Link href="/">Home</Link>{" | "}
      <Link href="/login">Login</Link>{" | "}
      <Link href="/calendar">Calendar</Link>{" | "}
      <Link href="/admin">Admin</Link>
    </nav>
  );
}
