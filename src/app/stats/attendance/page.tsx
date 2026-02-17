"use client";

import { useEffect, useMemo, useState } from "react";
import { Chart } from "react-google-charts";
import Button from "@/components/Button";
import { useAuth } from "@/components/AuthProvider";

type StatsResp = {
  totals: Record<string, number>;
  months: Array<{ month: string; [k: string]: number | string }>;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function ymdLocal(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function badgeLabel(k: string) {
  if (k === "PRESENT") return "PRESENT";
  if (k === "LATE") return "LATE";
  if (k === "ABSENT") return "ABSENT";
  return k;
}

export default function AttendanceStatsPage() {
  const { user } = useAuth();
  const canPickUser = user?.role === "ADMIN" || user?.role === "MANAGER";

  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return ymdLocal(d);
  });
  const [to, setTo] = useState(() => ymdLocal(new Date()));

  const [users, setUsers] = useState<
    { id: number; firstName: string; lastName: string; email: string }[]
  >([]);

  const [selectedUser, setSelectedUser] = useState<string>("ALL");

  const [data, setData] = useState<StatsResp | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!canPickUser) return;

    (async () => {
      const res = await fetch("/api/users", { credentials: "include" });
      const json = await res.json().catch(() => null);
      if (!res.ok) return;

      setUsers(
        (json?.users ?? []).map((u: any) => ({
          id: Number(u.id),
          firstName: u.firstName ?? "",
          lastName: u.lastName ?? "",
          email: u.email ?? "",
        }))
      );
    })();
  }, [canPickUser]);

  async function load() {
    setMsg("");

    const qs = new URLSearchParams();
    qs.set("from", from);
    qs.set("to", to);

    if (canPickUser) {
      qs.set("userId", selectedUser);
    }

    const res = await fetch(`/api/stats/attendance?${qs.toString()}`, {
      credentials: "include",
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setData(null);
      setMsg(json?.error ?? "Greška pri učitavanju statistike.");
      return;
    }
    setData(json as StatsResp);
  }

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  const pieData = useMemo(() => {
    if (!data) return null;
    return [
      ["Status", "Broj dana"],
      ["PRESENT", data.totals.PRESENT ?? 0],
      ["LATE", data.totals.LATE ?? 0],
      ["ABSENT", data.totals.ABSENT ?? 0],
    ];
  }, [data]);

  const monthData = useMemo(() => {
    if (!data) return null;
    return [
      ["Mesec", "PRESENT", "LATE", "ABSENT"],
      ...data.months.map((m) => [
        String(m.month),
        Number(m.PRESENT ?? 0),
        Number(m.LATE ?? 0),
        Number(m.ABSENT ?? 0),
      ]),
    ];
  }, [data]);

  if (!user) return null;

  return (
    <main>
      <h1 className="h1">Statistika prisustva</h1>
      <p className="h2">Google Charts vizualizacija (role-based).</p>

      <div className="card" style={{ marginTop: 20, padding: 18 }}>
        <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
                Od
              </div>
              <input
                className="select"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                style={{ minWidth: 160 }}
              />
            </div>

            <div>
              <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
                Do
              </div>
              <input
                className="select"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                style={{ minWidth: 160 }}
              />
            </div>

            {canPickUser ? (
              <div>
                <div
                  className="muted"
                  style={{ fontSize: 13, marginBottom: 6 }}
                >
                  Korisnik
                </div>
                <select
                  className="select"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  style={{ minWidth: 260 }}
                >
                  <option value="ALL">Svi zaposleni</option>
                  {users.map((u) => (
                    <option key={u.id} value={String(u.id)}>
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

          <div style={{ marginLeft: "auto" }}>
            <Button onClick={load}>Prikaži</Button>
          </div>
        </div>

        {msg ? (
          <div className="notice notice-error" style={{ marginTop: 10 }}>
            {msg}
          </div>
        ) : null}
      </div>

      {!data ? null : (
        <div style={{ display: "grid", gap: 18, marginTop: 20 }}>
          {/* PIE */}
          <div className="card" style={{ padding: 18 }}>
            <div className="sectionTitle">Udeo statusa</div>
            {pieData ? (
              <Chart
                chartType="PieChart"
                data={pieData}
                width="100%"
                height="320px"
                options={{
                  backgroundColor: "transparent",
                  legend: {
                    position: "right",
                    textStyle: { color: "#fffffff", fontSize: 12 },
                  },
                  pieHole: 0.45,
                  chartArea: { width: "90%", height: "85%" },
                  tooltip: { textStyle: { color: "#111" } },
                  colors: ["#2ecc71", "#f1c40f", "#e74c3c"],
                  pieSliceTextStyle: { color: "#111" },
                  titleTextStyle: { color: "#fff" },
                }}
              />
            ) : null}
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div className="sectionTitle">Pregled po mesecima</div>
            {monthData ? (
              <Chart
                chartType="ColumnChart"
                data={monthData}
                width="100%"
                height="360px"
                options={{
                  backgroundColor: "transparent",
                  isStacked: true,
                  legend: {
                    position: "top",
                    textStyle: { color: "#fffffff", fontSize: 13 },
                  },
                  chartArea: { width: "88%", height: "70%" },
                  colors: ["#2ecc71", "#f1c40f", "#e74c3c"],
                  hAxis: { textStyle: { color: "#fffffff" } },
                  vAxis: {
                    textStyle: { color: "#fffffff" },
                    gridlines: { color: "rgba(255,255,255,0.08)" },
                  },
                }}
              />
            ) : null}
          </div>
        </div>
      )}
    </main>
  );
}
