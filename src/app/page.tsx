import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Home</h1>
      <p>Izaberi stranicu:</p>

      <ul>
        <li><Link href="/login">Login</Link></li>
        <li><Link href="/calendar">Calendar</Link></li>
        <li><Link href="/admin">Admin</Link></li>
      </ul>
    </main>
  );
}
