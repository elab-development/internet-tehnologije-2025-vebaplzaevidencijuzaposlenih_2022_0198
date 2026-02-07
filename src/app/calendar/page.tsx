"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import TextField from "@/components/TextField";
import { addDays, startOfWeekMonday, toISODate } from "@/lib/date";
import { useAuth } from "@/components/AuthProvider";

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"];

type Activity = {
  id: number;
  name: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  user: { id: number; email: string; firstName: string; lastName: string };
  type: { id: number; name: string };
};

function ownerLabel(a: Activity) {
  const full = `${a.user.firstName} ${a.user.lastName}`.trim();
  return full ? full : a.user.email;
}

function isValidTime(t: string) {
  return /^\d{2}:\d{2}$/.test(t);
}

function timeToMinutes(t: string) {
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
}

function isoToHHMM(iso: string) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const canEditActivities = user?.role === "MANAGER" || user?.role === "ADMIN";

  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeekMonday(new Date())
  );

  const weekStartStr = toISODate(weekStart);
  const weekEndStr = toISODate(addDays(weekStart, 4));

  const [activities, setActivities] = useState<Activity[]>([]);

  const [open, setOpen] = useState(false);
  const [formDate, setFormDate] = useState("");
  const [users, setUsers] = useState<
    { id: number; firstName: string; lastName: string; email: string }[]
  >([]);
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [err, setErr] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const days = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  async function loadWeek() {
    const res = await fetch(
      `/api/activities?from=${weekStartStr}&to=${weekEndStr}`,
      { credentials: "include" }
    );
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      console.error("GET /api/activities failed:", data);
      setActivities([]);
      return;
    }

    const items: Activity[] = (data?.activities ?? []).map((a: any) => ({
      ...a,
      date: a.date?.toString().slice(0, 10),
      startTime: a.startTime,
      endTime: a.endTime,
    }));

    setActivities(items);
  }

  async function loadUsers() {
    if (!canEditActivities) return;

    const res = await fetch("/api/users", { credentials: "include" });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      console.error("GET /api/users failed:", data);
      setUsers([]);
      return;
    }

    setUsers(data?.users ?? []);
  }

  useEffect(() => {
    loadWeek();
  }, [weekStartStr, weekEndStr]);
  useEffect(() => {
    loadUsers();
  }, [canEditActivities]);

  const activitiesByDate = useMemo(() => {
    const map: Record<string, Activity[]> = {};
    for (const a of activities) {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    }
    for (const k of Object.keys(map)) {
      map[k].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    }
    return map;
  }, [activities]);

  function openAddModal(defaultDate?: string) {
    setEditingId(null);
    const d = defaultDate ?? weekStartStr;
    setFormDate(d);
    setUserId("");
    setTitle("");
    setStart("09:00");
    setEnd("10:00");
    setErr("");
    setOpen(true);
  }

  function openEditModal(a: Activity) {
    setEditingId(a.id);
    setFormDate(a.date);
    setUserId(String(a.user.id));
    setTitle(a.name);
    setStart(isoToHHMM(a.startTime));
    setEnd(isoToHHMM(a.endTime));
    setErr("");
    setOpen(true);
  }

  function validateForm() {
    if (canEditActivities && !userId) return "Moraš da izabereš korisnika.";
    if (!formDate) return "Datum je obavezan.";
    if (!title.trim()) return "Naziv aktivnosti je obavezan.";
    if (!isValidTime(start) || !isValidTime(end))
      return "Vreme mora biti u formatu HH:mm.";
    if (timeToMinutes(start) >= timeToMinutes(end))
      return "Početak mora biti pre kraja.";
    return "";
  }

  async function handleSave() {
    const msg = validateForm();
    if (msg) {
      setErr(msg);
      return;
    }

    const startISO = new Date(`${formDate}T${start}:00`).toISOString();
    const endISO = new Date(`${formDate}T${end}:00`).toISOString();

    if (editingId) {
      const res = await fetch(`/api/activities/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: title.trim(),
          description: null,
          date: formDate,
          startTime: startISO,
          endTime: endISO,
          userId: userId ? Number(userId) : undefined,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErr(data?.error ?? "Update failed");
        return;
      }
    } else {
      const res = await fetch(`/api/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: title.trim(),
          description: null,
          date: formDate,
          startTime: startISO,
          endTime: endISO,
          userId: userId ? Number(userId) : undefined,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErr(data?.error ?? "Create failed");
        return;
      }
    }

    setOpen(false);
    await loadWeek();
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/activities/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      console.error("Delete failed:", data);
      return;
    }

    await loadWeek();
  }

  return (
    <main>
      <h1 className="h1">Calendar</h1>
      <p className="h2">Pregled aktivnosti tokom radne nedelje (pon–pet).</p>

      <div className="weekHeader">
        <div className="row">
          <Button onClick={() => setWeekStart(addDays(weekStart, -7))}>
            Prev week
          </Button>
          <Button onClick={() => setWeekStart(startOfWeekMonday(new Date()))}>
            This week
          </Button>
          <Button onClick={() => setWeekStart(addDays(weekStart, 7))}>
            Next week
          </Button>
          {canEditActivities ? (
            <Button onClick={() => openAddModal()}>+ Add activity</Button>
          ) : null}
        </div>

        <span className="pill">
          Week: <strong>{weekStartStr}</strong> → <strong>{weekEndStr}</strong>
        </span>
      </div>

      <div className="weekGrid">
        {days.map((d, idx) => {
          const dateStr = toISODate(d);
          const list = activitiesByDate[dateStr] ?? [];

          return (
            <section key={dateStr} className="dayCol">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="dayTitle">
                  {dayNames[idx]} <span className="muted">({dateStr})</span>
                </div>
                {canEditActivities ? (
                  <Button onClick={() => openAddModal(dateStr)}>Add</Button>
                ) : null}
              </div>

              {list.length === 0 ? (
                <div className="muted">No activities.</div>
              ) : (
                list.map((a) => (
                  <div key={a.id} className="eventCard">
                    <p className="eventTitle">{a.name}</p>

                    <div className="eventTime">
                      {isoToHHMM(a.startTime)} – {isoToHHMM(a.endTime)}
                    </div>

                    {canEditActivities ? (
                      <div className="muted" style={{ fontSize: 12 }}>
                        User: <strong>{ownerLabel(a)}</strong>
                      </div>
                    ) : null}

                    {canEditActivities ? (
                      <div
                        className="modalActions"
                        style={{ justifyContent: "flex-start" }}
                      >
                        <Button onClick={() => openEditModal(a)}>Edit</Button>
                        <Button onClick={() => handleDelete(a.id)}>
                          Delete
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </section>
          );
        })}
      </div>

      <Modal
        open={open}
        title={editingId ? "Edit activity" : "Add activity"}
        onClose={() => setOpen(false)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <TextField
            label="Datum (YYYY-MM-DD)"
            value={formDate}
            onChange={setFormDate}
            placeholder="2026-01-27"
          />
          {canEditActivities ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13 }} className="muted">
                Korisnik
              </label>

              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="select"
              >
                {users.map((u) => (
                  <option key={u.id} value={String(u.id)}>
                    {u.firstName} {u.lastName} — {u.email}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <TextField
            label="Naziv"
            value={title}
            onChange={setTitle}
            placeholder="npr. Nastava / Sastanak"
          />

          <div className="row">
            <div style={{ flex: 1 }}>
              <TextField
                label="Početak (HH:mm)"
                value={start}
                onChange={setStart}
                placeholder="09:00"
              />
            </div>
            <div style={{ flex: 1 }}>
              <TextField
                label="Kraj (HH:mm)"
                value={end}
                onChange={setEnd}
                placeholder="10:00"
              />
            </div>
          </div>

          {err ? (
            <div style={{ color: "#ff6b6b", fontSize: 13 }}>{err}</div>
          ) : null}

          <div className="hr" />

          <div className="modalActions">
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
