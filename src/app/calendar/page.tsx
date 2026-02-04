"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import TextField from "@/components/TextField";
import { addDays, startOfWeekMonday, toISODate } from "@/lib/date";
import { mockActivities, type MockActivity } from "@/lib/mock";
import { useAuth } from "@/components/AuthProvider";

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function isValidTime(t: string) {
  //hh:mm
  return /^\d{2}:\d{2}$/.test(t);
}

function timeToMinutes(t: string) {
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const canEditActivities = user?.role === "MANAGER" || user?.role === "ADMIN";

  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeekMonday(new Date())
  );

  const [activities, setActivities] = useState<MockActivity[]>(
    () => mockActivities
  );

  //modal state
  const [open, setOpen] = useState(false);
  const [formDate, setFormDate] = useState("");
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [err, setErr] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const days = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const activitiesByDate = useMemo(() => {
    const map: Record<string, MockActivity[]> = {};
    for (const a of activities) {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    }
    //sortiranje
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
    }
    return map;
  }, [activities]);

  useEffect(() => {}, [weekStart]);

  const weekStartStr = toISODate(weekStart);
  const weekEndStr = toISODate(addDays(weekStart, 4));

  function openAddModal(defaultDate?: string) {
    setEditingId(null);
    const d = defaultDate ?? weekStartStr;
    setFormDate(d);
    setTitle("");
    setStart("09:00");
    setEnd("10:00");
    setErr("");
    setOpen(true);
  }

  function openEditModal(a: MockActivity) {
    setEditingId(a.id);
    setFormDate(a.date);
    setTitle(a.title);
    setStart(a.start);
    setEnd(a.end);
    setErr("");
    setOpen(true);
  }

  function validateForm() {
    if (!formDate) return "Datum je obavezan.";
    if (!title.trim()) return "Naziv aktivnosti je obavezan.";
    if (!isValidTime(start) || !isValidTime(end))
      return "Vreme mora biti u formatu HH:mm.";
    if (timeToMinutes(start) >= timeToMinutes(end))
      return "Početak mora biti pre kraja.";
    return "";
  }

  function handleSave() {
    const msg = validateForm();
    if (msg) {
      setErr(msg);
      return;
    }

    if (editingId) {
      setActivities((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? { ...a, date: formDate, title: title.trim(), start, end }
            : a
        )
      );
    } else {
      const newActivity: MockActivity = {
        id: String(Date.now()),
        date: formDate,
        title: title.trim(),
        start,
        end,
      };
      setActivities((prev) => [...prev, newActivity]);
    }

    setOpen(false);
  }

  function handleDelete(id: string) {
    setActivities((prev) => prev.filter((a) => a.id !== id));
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
                    <p className="eventTitle">{a.title}</p>
                    <div className="eventTime">
                      {a.start} – {a.end}
                    </div>

                    <div
                      className="modalActions"
                      style={{ justifyContent: "flex-start" }}
                    >
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
