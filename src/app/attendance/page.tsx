"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Button from "@/components/Button";
import {
  checkIn,
  checkOut,
  getAttendanceForUser,
  getTodayRecord,
} from "@/lib/attendanceStore";
import type { AttendanceRecord } from "@/lib/types";

export default function AttendancePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [statusMsg, setStatusMsg] = useState("");

  // ✅ Email je uvek string (kad user ne postoji -> prazno)
  const email = user?.email ?? "";

  // ✅ Hook se uvek poziva (nema return pre njega)
  const today = useMemo(() => {
    if (!email) return undefined;
    return getTodayRecord(email);
  }, [email, records]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    setRecords(getAttendanceForUser(user.email));
  }, [user, router]);

  // ✅ Tek posle svih hook-ova smeš da renderuješ null
  if (!user) return null;

  const canCheckIn = !today?.checkInAt;
  const canCheckOut = !!today?.checkInAt && !today?.checkOutAt;

  function handleCheckIn() {
    setStatusMsg("");
    checkIn(email);
    setRecords(getAttendanceForUser(email));
    setStatusMsg("Dolazak evidentiran.");
  }

  function handleCheckOut() {
    setStatusMsg("");
    checkOut(email);
    setRecords(getAttendanceForUser(email));
    setStatusMsg("Odlazak evidentiran.");
  }

  return (
    <main>
      <h1 className="h1">Prisustvo</h1>
      <p className="h2">Evidentiraj dolazak/odlazak i vidi istoriju.</p>

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
        <h2 style={{ margin: 0, fontSize: 16 }}>Istorija</h2>

        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}
          >
            <thead>
              <tr
                style={{ textAlign: "left", borderBottom: "1px solid #2a2a2a" }}
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
                  <td style={{ padding: "10px 8px" }}>{r.checkInAt ?? "-"}</td>
                  <td style={{ padding: "10px 8px" }}>{r.checkOutAt ?? "-"}</td>
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
      </div>
    </main>
  );
}
