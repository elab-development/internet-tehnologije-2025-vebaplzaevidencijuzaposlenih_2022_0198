"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Button";
import { useAuth } from "@/components/AuthProvider";

type WfhReq = {
  id: number;
  date: string; // YYYY-MM-DD
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string | null;
  createdAt: string;
  decidedAt: string | null;
  decidedBy: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("sr-RS");
}

function statusLabel(s: WfhReq["status"]) {
  if (s === "PENDING") return "NA ČEKANJU";
  if (s === "APPROVED") return "ODOBRENO";
  return "ODBIJENO";
}
function badgeClassWfh(status: WfhReq["status"]) {
  if (status === "APPROVED") return "badge badge-present";
  if (status === "PENDING") return "badge badge-late";
  return "badge badge-absent";
}

export default function MyRequestsPage() {
  const { user } = useAuth();
  const isEmployee = user?.role === "EMPLOYEE";

  const [items, setItems] = useState<WfhReq[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    setMsg("");
    const res = await fetch("/api/wfh-request", { credentials: "include" });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setItems([]);
      setMsg(data?.error ?? "Greška pri učitavanju zahteva.");
      return;
    }

    setItems((data?.requests ?? []) as WfhReq[]);
  }

  useEffect(() => {
    load();
  }, []);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => b.date.localeCompare(a.date));
  }, [items]);

  if (!isEmployee) {
    return (
      <main>
        <h1 className="h1">Moji zahtevi</h1>
        <div className="muted">Ova stranica je dostupna samo zaposlenima.</div>
      </main>
    );
  }

  return (
    <main>
      <h1 className="h1">Moji zahtevi (WFH)</h1>
      <p className="h2">Pregled svih poslatih WFH zahteva i statusa.</p>

      <div className="row" style={{ gap: 10, marginTop: 10, display: "flex" }}>
        <span className="muted">
          Ukupno: <b>{sorted.length}</b>
        </span>
        <Button onClick={load}>Osveži</Button>
      </div>

      {msg ? (
        <div className="notice notice-error" style={{ marginTop: 10 }}>
          {msg}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        {sorted.length === 0 ? (
          <div className="muted">Nema zahteva.</div>
        ) : (
          sorted.map((r) => (
            <div key={r.id} className="card" style={{ padding: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <span>{r.date}</span>

                    <span className={badgeClassWfh(r.status)}>
                      {statusLabel(r.status)}
                    </span>
                  </div>

                  <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                    Podnet: {fmt(r.createdAt)}
                    {" • "}Odluka: {fmt(r.decidedAt)}
                  </div>

                  {r.reason ? (
                    <div
                      className="muted"
                      style={{ marginTop: 8, fontSize: 14 }}
                    >
                      Razlog: <b>{r.reason}</b>
                    </div>
                  ) : null}

                  {r.decidedBy ? (
                    <div
                      className="muted"
                      style={{ marginTop: 6, fontSize: 13 }}
                    >
                      Obrađeno od:{" "}
                      <b>
                        {`${r.decidedBy.firstName} ${r.decidedBy.lastName}`.trim() ||
                          r.decidedBy.email}
                      </b>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
