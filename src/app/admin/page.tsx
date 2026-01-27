"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push("/login");
    else if (user.role !== "ADMIN") router.push("/calendar");
  }, [user, router]);

  if (!user) return null;
  if (user.role !== "ADMIN") return null;

  return (
    <main>
      <h1 className="h1">Admin</h1>
      <p className="h2">Samo ADMIN ima pristup ovoj stranici.</p>

      <div className="card" style={{ marginTop: 16 }}>
        <p className="muted">Ovde sledece pravimo listu korisnika + deactivate + export .ics.</p>
      </div>
    </main>
  );
}
