"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Button";

type WfhReq = {
  id: number;
  date: string; // YYYY-MM-DD
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string | null;
  createdAt: string; // ISO
  user: { id: number; firstName: string; lastName: string; email: string };
  decidedAt: string | null;
  decidedBy: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

function userLabel(u: WfhReq["user"]) {
  const full = `${u.firstName} ${u.lastName}`.trim();
  return full ? full : u.email;
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("sr-RS");
}

export default function WfhRequestsAdminCard() {
  const [items, setItems] = useState<WfhReq[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string>("");

  async function loadAll() {
    setMsg("");
    const res = await fetch("/api/wfh-request", { credentials: "include" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setItems([]);
      setMsg(data?.error ?? "Greška pri učitavanju WFH zahteva.");
      return;
    }
    const all = (data?.requests ?? []) as WfhReq[];

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    const visible = all.filter((r) => {
      const t = new Date(r.createdAt).getTime();
      if (Number.isNaN(t)) return true; // ako je datum loš, ne sakrivaj
      return now - t <= DAY;
    });

    setItems(visible);
  }

  async function decide(id: number, status: "APPROVED" | "REJECTED") {
    setBusyId(id);
    setMsg("");
    try {
      const res = await fetch(`/api/wfh-request/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMsg(data?.error ?? "Greška pri odluci.");
        return;
      }
      await loadAll();
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const pending = useMemo(
    () => items.filter((x) => x.status === "PENDING"),
    [items]
  );
  const decided = useMemo(
    () => items.filter((x) => x.status !== "PENDING"),
    [items]
  );

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "baseline",
        }}
      >
        <div>
          <div className="sectionTitle" style={{ margin: 0 }}>
            Zahtevi za rad od kuće (WFH)
          </div>
          <div className="muted" style={{ marginTop: 4 }}>
            Pending: <b>{pending.length}</b> • Ukupno: <b>{items.length}</b>
          </div>
        </div>

        <Button onClick={loadAll}>Osveži</Button>
      </div>

      {msg ? (
        <div className="notice notice-error" style={{ marginTop: 10 }}>
          {msg}
        </div>
      ) : null}

      {/* PENDING */}
      <div style={{ marginTop: 12 }}>
        {pending.length === 0 ? (
          <div className="muted">Nema novih zahteva.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {pending.map((r) => (
              <div key={r.id} className="card wfhRequestCard">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>
                      {userLabel(r.user)}{" "}
                      <span className="muted" style={{ fontWeight: 400 }}>
                        • {r.date}
                      </span>
                    </div>
                    <div
                      className="muted"
                      style={{ marginTop: 4, fontSize: 12 }}
                    >
                      Podnet: {fmt(r.createdAt)}
                    </div>
                    {r.reason ? (
                      <div className="muted" style={{ marginTop: 8 }}>
                        Razlog: <b>{r.reason}</b>
                      </div>
                    ) : (
                      <div className="muted" style={{ marginTop: 8 }}>
                        Razlog: —
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Button
                      disabled={busyId === r.id}
                      onClick={() => decide(r.id, "APPROVED")}
                    >
                      <img
                        src="/icons/wfh-icons/check.svg"
                        alt="Odobri"
                        style={{ width: 18, height: 18 }}
                      />
                    </Button>

                    <Button
                      disabled={busyId === r.id}
                      onClick={() => decide(r.id, "REJECTED")}
                    >
                      <img
                        src="/icons/wfh-icons/deny.svg"
                        alt="Odbij"
                        style={{ width: 18, height: 18 }}
                      />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="hr" style={{ marginTop: 14, marginBottom: 12 }} />

      {/* DECIDED */}
      <div>
        <div className="muted" style={{ fontSize: 13 }}>
          Obrađeni zahtevi
        </div>

        {decided.length === 0 ? (
          <div className="muted" style={{ marginTop: 8 }}>
            Još nema obrađenih zahteva.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {decided.map((r) => (
              <div key={r.id} className="card wfhRequestCard wfhRequestCardDecided">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>
                      {userLabel(r.user)}{" "}
                      <span className="muted" style={{ fontWeight: 400 }}>
                        • {r.date}
                      </span>
                    </div>

                    <div
                      className="muted"
                      style={{ marginTop: 6, fontSize: 12 }}
                    >
                      Status:{" "}
                      <b>{r.status === "APPROVED" ? "ODOBRENO" : "ODBIJENO"}</b>
                      {" • "}Odluka: {fmt(r.decidedAt)}
                    </div>

                    {r.reason ? (
                      <div className="muted" style={{ marginTop: 8 }}>
                        Razlog: <b>{r.reason}</b>
                      </div>
                    ) : null}
                  </div>

                  <div
                    className="muted"
                    style={{ fontSize: 12, textAlign: "right" }}
                  >
                    Podnet: {fmt(r.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
