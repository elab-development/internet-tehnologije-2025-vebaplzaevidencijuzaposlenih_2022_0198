"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import TextField from "@/components/TextField";
import { addDays, startOfWeekMonday, toISODate } from "@/lib/date";
import { useAuth } from "@/components/AuthProvider";

const dayNames = ["Pon", "Uto", "Sre", "Čet", "Pet"];

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

function isValidISODate(d: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const dt = new Date(`${d}T00:00:00.000Z`);
  return !Number.isNaN(dt.getTime());
}

function safeToISOString(d: Date) {
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
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
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState<"info" | "error">("info");
  const [busy, setBusy] = useState(false);

  const [exportBusy, setExportBusy] = useState(false);
  const [exportUserId, setExportUserId] = useState<string>("");

  useEffect(() => {
    if (!statusMsg) return;
    const t = setTimeout(() => setStatusMsg(""), 5000);
    return () => clearTimeout(t);
  }, [statusMsg]);

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
    try {
      const res = await fetch(
        `/api/activities?from=${weekStartStr}&to=${weekEndStr}`,
        { credentials: "include" }
      );
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setStatusType("error");
        setStatusMsg(data?.error ?? "Greška pri učitavanju aktivnosti.");
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
    } catch {
      setStatusType("error");
      setStatusMsg("Greška pri učitavanju aktivnosti.");
      setActivities([]);
    }
  }

  async function loadUsers() {
    if (!canEditActivities) return;

    try {
      const res = await fetch("/api/users", { credentials: "include" });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setStatusType("error");
        setStatusMsg(data?.error ?? "Greška pri učitavanju korisnika.");
        setUsers([]);
        return;
      }

      const loaded = data?.users ?? [];
      setUsers(loaded);

      if (!exportUserId && loaded.length > 0) {
        setExportUserId(String(loaded[0].id));
      }

      if (!exportUserId && loaded.length > 0) {
        setExportUserId(String(loaded[0].id));
      }
    } catch {
      setStatusType("error");
      setStatusMsg("Greška pri učitavanju korisnika.");
      setUsers([]);
    }
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
    if (!isValidISODate(formDate))
      return "Datum mora biti validan i u formatu YYYY-MM-DD.";
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
    setBusy(true);
    setErr("");

    const startDateObj = new Date(`${formDate}T${start}:00`);
    const endDateObj = new Date(`${formDate}T${end}:00`);

    const startISO = safeToISOString(startDateObj);
    const endISO = safeToISOString(endDateObj);

    if (!startISO || !endISO) {
      setErr("Datum/vreme nije validno. Proveri unos.");
      return;
    }

    try {
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
          setErr(data?.error ?? "Greska");
          return;
        }
      }

      setOpen(false);
      setStatusType("info");
      setStatusMsg(editingId ? "Aktivnost izmenjena." : "Aktivnost dodata.");

      await loadWeek();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: number) {
    setBusy(true);
    try {
      const res = await fetch(`/api/activities/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setStatusType("error");
        setStatusMsg(data?.error ?? "Greška pri brisanju aktivnosti.");
        return;
      }

      setStatusType("info");
      setStatusMsg("Aktivnost obrisana.");
      await loadWeek();
    } finally {
      setBusy(false);
    }
  }

  async function handleExportICS() {
    try {
      setExportBusy(true);

      let url = `/api/activities/ics?from=${weekStartStr}&to=${weekEndStr}`;

      //samo admin i manager smeju da biraju drugog korisnika
      if (canEditActivities && exportUserId) {
        url += `&userId=${encodeURIComponent(exportUserId)}`;
      }

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatusType("error");
        setStatusMsg(data?.error ?? "Greška pri exportu .ics fajla.");
        return;
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = objectUrl;

      const suffix =
        canEditActivities && exportUserId ? `_user${exportUserId}` : "";
      a.download = `calendar_${weekStartStr}_${weekEndStr}${suffix}.ics`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(objectUrl);

      setStatusType("info");
      setStatusMsg("ICS fajl je preuzet.");
    } catch {
      setStatusType("error");
      setStatusMsg("Greška pri exportu .ics fajla.");
    } finally {
      setExportBusy(false);
    }
  }

  return (
    <main>
      <h1 className="h1">Kalendar Aktivnosti</h1>
      <p className="h2">Pregled aktivnosti tokom radne nedelje (pon–pet).</p>

      <div className="weekHeader">
        <div className="row">
          <Button onClick={() => setWeekStart(addDays(weekStart, -7))}>
            Prošla ned.
          </Button>
          <Button onClick={() => setWeekStart(startOfWeekMonday(new Date()))}>
            Trenutna ned.
          </Button>
          <Button onClick={() => setWeekStart(addDays(weekStart, 7))}>
            Sledeca ned.
          </Button>

          {canEditActivities ? (
            <Button onClick={() => openAddModal()}>+ Dodaj aktivnost</Button>
          ) : null}
        </div>

        <span className="pill">
          Nedelja: <strong>{weekStartStr}</strong> →{" "}
          <strong>{weekEndStr}</strong>
        </span>
      </div>
      {statusMsg ? (
        <div
          className={`notice ${statusType === "error" ? "notice-error" : ""}`}
        >
          {statusMsg}
        </div>
      ) : null}

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
              </div>
              {canEditActivities ? (
                <Button onClick={() => openAddModal(dateStr)}>+</Button>
              ) : null}

              {list.length === 0 ? (
                <div className="muted">Nema aktivnosti.</div>
              ) : (
                list.map((a) => (
                  <div key={a.id} className="eventCard">
                    <p className="eventTitle">{a.name}</p>

                    <div className="eventTime">
                      {isoToHHMM(a.startTime)} – {isoToHHMM(a.endTime)}
                    </div>

                    {canEditActivities ? (
                      <div className="muted" style={{ fontSize: 12 }}>
                        Korisnik: <strong>{ownerLabel(a)}</strong>
                      </div>
                    ) : null}

                    {canEditActivities ? (
                      <div
                        className="modalActions"
                        style={{ justifyContent: "flex-start" }}
                      >
                        <Button onClick={() => openEditModal(a)}>Izmeni</Button>
                        <Button
                          disabled={busy}
                          onClick={() => handleDelete(a.id)}
                        >
                          Obriši
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

      <div
        className="row"
        style={{ justifyContent: "space-between", marginTop: 16 }}
      >
        <span className="pill">
          Export: <strong>{weekStartStr}</strong> →{" "}
          <strong>{weekEndStr}</strong>
        </span>

        <div className="row" style={{ gap: 10 }}>
          {canEditActivities ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="muted" style={{ fontSize: 13 }}>
                Izaberi korisnika:
              </span>

              <select
                className="select"
                value={exportUserId}
                onChange={(e) => setExportUserId(e.target.value)}
                disabled={users.length === 0}
                style={{ minWidth: 160 }}
              >
                {users.map((u) => (
                  <option key={u.id} value={String(u.id)}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {!canEditActivities ? (
            <span className="muted" style={{ fontSize: 13 }}>
              Exportuješ svoj kalendar
            </span>
          ) : null}

          <Button
            disabled={exportBusy || (canEditActivities && !exportUserId)}
            onClick={handleExportICS}
          >
            {exportBusy ? "Exporting..." : "Export .ics"}
          </Button>
        </div>
      </div>

      <Modal
        open={open}
        title={editingId ? "Izmeni aktivnost" : "Dodaj aktivnost"}
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
            <Button disabled={busy} onClick={() => setOpen(false)}>
              Poništi
            </Button>
            <Button disabled={busy} onClick={handleSave}>
              Sačuvaj
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
