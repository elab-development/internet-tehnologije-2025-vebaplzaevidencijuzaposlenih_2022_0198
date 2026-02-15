"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Button from "@/components/Button";
import type { AttendanceRecord } from "@/lib/types";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function todayYMDLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function isoToHHMM(iso: string) {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function badgeClass(status: string) {
  if (status === "PRESENT") return "badge badge-present";
  if (status === "LATE") return "badge badge-late";
  return "badge badge-absent";
}

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

    const to = todayYMDLocal();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    const from = `${fromDate.getFullYear()}-${pad2(
      fromDate.getMonth() + 1
    )}-${pad2(fromDate.getDate())}`;

    const qs = new URLSearchParams();

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

    const mapped: AttendanceRecord[] = (data.items ?? []).map((a: any) => ({
      id: a.id,
      date: a.date,
      checkInAt: a.startTime ? isoToHHMM(a.startTime) : null,
      checkOutAt: a.endTime ? isoToHHMM(a.endTime) : null,
      status: a.status,
    }));

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
    const t = todayYMDLocal();
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
      body: JSON.stringify({ date: todayYMDLocal() }),
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
      body: JSON.stringify({ date: todayYMDLocal() }),
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

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>
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
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {canEditActivities ? (
              <div
                style={{
                  marginLeft: "auto",
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
                  style={{ minWidth: 280 }}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName || u.lastName
                        ? `${u.firstName} ${u.lastName}`.trim() +
                          ` — ${u.email}`
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

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Istorija poslednjih 30 dana</h2>

        {loading ? (
          <div className="muted" style={{ marginTop: 12 }}>
            Učitavam...
          </div>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 520,
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #2a2a2a",
                  }}
                >
                  <th style={{ padding: "10px 8px" }}>Datum</th>
                  <th style={{ padding: "10px 8px" }}>Dolazak</th>
                  <th style={{ padding: "10px 8px" }}>Odlazak</th>
                  <th style={{ padding: "10px 8px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr
                    key={r.date}
                    style={{ borderBottom: "1px solid #161616" }}
                  >
                    <td style={{ padding: "10px 8px" }}>{r.date}</td>

                    <td style={{ padding: "10px 8px" }}>
                      {r.checkInAt ?? "-"}
                    </td>

                    <td style={{ padding: "10px 8px" }}>
                      {r.checkOutAt ?? "-"}
                    </td>

                    <td style={{ padding: "10px 8px" }}>
                      <span className={badgeClass(r.status)}>{r.status}</span>
                    </td>
                  </tr>
                ))}

                {records.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="muted"
                      style={{ padding: "12px 8px" }}
                    >
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
