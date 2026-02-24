"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { toISODate, addDays } from "@/lib/date/date";
//import { isoToHHMM } from "@/lib/format";
import { attendanceBadgeClass } from "@/lib/attendance/attendance.utils";
import { mapAttendanceApiItemToRecord } from "@/lib/attendance/attendance";
import Button from "@/components/Button";
import type { AttendanceRecord } from "@/lib/types/types";

export default function AttendancePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const canEditActivities = user?.role === "MANAGER" || user?.role === "ADMIN";
  const [users, setUsers] = useState<
    { id: number; firstName: string; lastName: string; email: string }[]
  >([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  const loadHistory = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setStatusMsg("");

    const now = new Date();
    const to = toISODate(now);
    const from = toISODate(addDays(now, -30));

    const qs = new URLSearchParams();
    qs.set("from", from);
    qs.set("to", to);

    if (canEditActivities) {
      if (selectedUserId == null) {
        setLoading(false);
        return;
      }
      qs.set("userId", String(selectedUserId));
    }

    const res = await fetch(`/api/attendance?${qs.toString()}`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setStatusMsg(data?.error ?? "Greška pri učitavanju istorije.");
      setRecords([]);
      setLoading(false);
      return;
    }

    const data = await res.json();

    const mapped: AttendanceRecord[] = (data.items ?? []).map(
      mapAttendanceApiItemToRecord
    );

    mapped.sort((x, y) => (x.date < y.date ? 1 : -1));

    setRecords(mapped);
    setLoading(false);
  }, [user, selectedUserId, canEditActivities]);

  useEffect(() => {
    if (!user) return;
    loadHistory();
  }, [user, loadHistory]);

  useEffect(() => {
    if (!user) return;
    if (!canEditActivities) return;

    (async () => {
      const res = await fetch("/api/users", { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setStatusMsg(err?.error ?? "Ne mogu da učitam korisnike.");
        return;
      }

      const data = await res.json().catch(() => null);

      const list = (data?.users ?? []).map((u: any) => ({
        id: Number(u.id),
        firstName: u.firstName ?? "",
        lastName: u.lastName ?? "",
        email: u.email ?? "",
      }));

      setUsers(list);

      // DEFAULT: izaberi mene po email-u
      const me = list.find((x: any) => x.email === user.email);
      if (me) setSelectedUserId(me.id);
      else if (list.length > 0) setSelectedUserId(list[0].id);
    })();
  }, [user, canEditActivities]);

  const today = useMemo(() => {
    const t = toISODate(new Date());
    return records.find((r) => r.date === t);
  }, [records]);

  if (!user) return null;

  const canCheckIn = !today?.checkInAt;
  const canCheckOut = !!today?.checkInAt && !today?.checkOutAt;

  const isEmployee = user?.role === "EMPLOYEE";

  async function handleCheckIn() {
    setStatusMsg("");
    const res = await fetch("/api/attendance/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ date: toISODate(new Date()) }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setStatusMsg(data?.error ?? "Greška pri evidentiranju dolaska.");
      return;
    }

    setStatusMsg("Dolazak evidentiran.");
    await loadHistory();
  }

  async function handleCheckOut() {
    setStatusMsg("");
    const res = await fetch("/api/attendance/check-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ date: toISODate(new Date()) }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setStatusMsg(data?.error ?? "Greška pri evidentiranju odlaska.");
      return;
    }

    setStatusMsg("Odlazak evidentiran.");
    await loadHistory();
  }

  return (
    <main>
      <h1 className="h1">Prisustvo</h1>
      <p className="h2">Evidentiraj dolazak/odlazak.</p>

      <div
        className="card"
        style={{
          marginTop: 20,
          borderLeft: "4px solid #4f46e5",
          boxShadow: "0 4px 24px rgba(15, 23, 42, 0.12)",
        }}
      >
        <h2 className="sectionTitle" style={{ margin: 0, fontSize: 16 }}>
          Danas: {new Date().toLocaleDateString("sr-RS")}
        </h2>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 12,
          }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button onClick={handleCheckIn} disabled={!canCheckIn}>
              Evidentiraj dolazak
            </Button>

            <Button onClick={handleCheckOut} disabled={!canCheckOut}>
              Evidentiraj odlazak
            </Button>

            {statusMsg ? <span className="muted">{statusMsg}</span> : null}
          </div>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="muted">Statistika korisnika:</span>
              <Button
                onClick={() => {
                  router.push("/stats/attendance");
                }}
              >
                Statistika
              </Button>
            </div>
            {canEditActivities ? (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <span className="muted">Aktivnost korisnika:</span>

                <select
                  value={selectedUserId ?? ""}
                  onChange={(e) => setSelectedUserId(Number(e.target.value))}
                  className="select"
                  style={{ minWidth: 150 }}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName || u.lastName
                        ? `${u.firstName} ${u.lastName}`.trim()
                        : u.email}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          {isEmployee ? (
            <Button
              onClick={() => {
                router.push("/calendar?wfh=1");
              }}
            >
              Priloži WFH zahtev
            </Button>
          ) : null}
        </div>

        <div className="muted" style={{ marginTop: 10 }}>
          Dolazak: <b>{today?.checkInAt ?? "-"}</b> | Odlazak:{" "}
          <b>{today?.checkOutAt ?? "-"}</b>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h2 className="sectionTitle" style={{ margin: 0, fontSize: 16 }}>
          Istorija poslednjih 30 dana
        </h2>

        {loading ? (
          <div className="muted" style={{ marginTop: 12 }}>
            Učitavam...
          </div>
        ) : (
          <div className="tableWrap">
            <table className="attendanceTable">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Dolazak</th>
                  <th>Odlazak</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.date}>
                    <td>{r.date}</td>
                    <td>{r.checkInAt ?? "-"}</td>
                    <td>{r.checkOutAt ?? "-"}</td>
                    <td>
                      <span className={attendanceBadgeClass(r.status)}>
                        {r.status}
                      </span>{" "}
                    </td>
                  </tr>
                ))}

                {records.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      Još nema zapisa.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
