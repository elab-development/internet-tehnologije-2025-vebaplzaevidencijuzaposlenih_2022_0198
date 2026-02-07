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

export default function AttendancePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(true);

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

    const res = await fetch(`/api/attendance?from=${from}&to=${to}`, {
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
    }));

    mapped.sort((x, y) => (x.date > y.date ? 1 : -1));

    setRecords(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadHistory();
  }, [user, loadHistory]);

  const today = useMemo(() => {
    const t = todayYMDLocal();
    return records.find((r) => r.date === t);
  }, [records]);

  if (!user) return null;

  const canCheckIn = !today?.checkInAt;
  const canCheckOut = !!today?.checkInAt && !today?.checkOutAt;

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
          style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}
        >
          <Button onClick={handleCheckIn} disabled={!canCheckIn}>
            Evidentiraj dolazak
          </Button>

          <Button onClick={handleCheckOut} disabled={!canCheckOut}>
            Evidentiraj odlazak
          </Button>

          {statusMsg ? <span className="muted">{statusMsg}</span> : null}
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
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #161616" }}>
                    <td style={{ padding: "10px 8px" }}>{r.date}</td>
                    <td style={{ padding: "10px 8px" }}>
                      {r.checkInAt ?? "-"}
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      {r.checkOutAt ?? "-"}
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
