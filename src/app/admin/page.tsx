"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Button from "@/components/Button";
import TextField from "@/components/TextField";
import {
  getUsers,
  saveUsers,
  updateUser,
  upsertUser,
  type AdminUser,
  type Role,
} from "@/lib/adminStore";

function formatDate(ts: number) {
  const d = new Date(ts);
  // simple + stable
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function newId() {
  return `u_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  // auth guard
  useEffect(() => {
    if (!user) router.push("/login");
    else if (user.role !== "ADMIN") router.push("/calendar");
  }, [user, router]);

  // data
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  // create demo user form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("EMPLOYEE");

  // load once on mount
  useEffect(() => {
    const u = getUsers();
    setUsers(u);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      return (
        u.email.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    });
  }, [users, query]);

  if (!user) return null;
  if (user.role !== "ADMIN") return null;

  function handleToggleActive(id: string, nextActive: boolean) {
    setStatusMsg("");
    const next = updateUser(id, { active: nextActive });
    setUsers(next);
    setStatusMsg(nextActive ? "Korisnik aktiviran." : "Korisnik deaktiviran.");
  }

  function handleChangeRole(id: string, role: Role) {
    setStatusMsg("");
    const next = updateUser(id, { role });
    setUsers(next);
    setStatusMsg("Uloga izmenjena.");
  }

  function handleDelete(id: string) {
    setStatusMsg("");
    const next = users.filter((u) => u.id !== id);
    saveUsers(next);
    setUsers(next);
    setStatusMsg("Korisnik obrisan (demo).");
  }

  function handleCreate() {
    setStatusMsg("");
    const name = newName.trim();
    const email = newEmail.trim().toLowerCase();
    if (!name || !email) {
      setStatusMsg("Ime i email su obavezni.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatusMsg("Email format nije ispravan.");
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === email)) {
      setStatusMsg("Korisnik sa tim email-om već postoji.");
      return;
    }

    const created: AdminUser = {
      id: newId(),
      name,
      email,
      role: newRole,
      active: true,
      createdAt: Date.now(),
    };

    const next = upsertUser(created);
    setUsers(next);
    setNewName("");
    setNewEmail("");
    setNewRole("EMPLOYEE");
    setStatusMsg("Korisnik kreiran (demo).");
  }

  return (
    <main>
      <h1 className="h1">Admin</h1>
      <p className="h2">Upravljanje korisnicima (demo, localStorage).</p>

      {/* Search */}
      <div className="card" style={{ marginTop: 16 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 240 }}>
            <TextField
              label="Pretraga"
              value={query}
              onChange={setQuery}
              placeholder="email, ime ili role…"
            />
          </div>
          <div style={{ paddingBottom: 2 }} className="muted">
            Ukupno: <b>{users.length}</b> | Prikaz: <b>{filtered.length}</b>
          </div>
        </div>

        {statusMsg ? (
          <p className="muted" style={{ marginTop: 10 }}>
            {statusMsg}
          </p>
        ) : null}
      </div>

      {/* Create user */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Dodaj korisnika (demo)</h2>
        <div
          style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <TextField
              label="Ime"
              value={newName}
              onChange={setNewName}
              placeholder="npr. Marko Marković"
            />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <TextField
              label="Email"
              value={newEmail}
              onChange={setNewEmail}
              placeholder="npr. marko@mail.com"
            />
          </div>

          <div style={{ minWidth: 180 }}>
            <label style={{ fontWeight: 700 }}>Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as Role)}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #333",
                background: "#0b0b0b",
                color: "inherit",
              }}
            >
              <option value="EMPLOYEE">EMPLOYEE</option>
              <option value="MANAGER">MANAGER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div style={{ alignSelf: "flex-end" }}>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Korisnici</h2>

        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}
          >
            <thead>
              <tr
                style={{ textAlign: "left", borderBottom: "1px solid #2a2a2a" }}
              >
                <th style={{ padding: "10px 8px" }}>Ime</th>
                <th style={{ padding: "10px 8px" }}>Email</th>
                <th style={{ padding: "10px 8px" }}>Role</th>
                <th style={{ padding: "10px 8px" }}>Status</th>
                <th style={{ padding: "10px 8px" }}>Kreiran</th>
                <th style={{ padding: "10px 8px" }}>Akcije</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #161616" }}>
                  <td style={{ padding: "10px 8px" }}>{u.name}</td>
                  <td style={{ padding: "10px 8px" }}>{u.email}</td>

                  <td style={{ padding: "10px 8px" }}>
                    <select
                      value={u.role}
                      onChange={(e) =>
                        handleChangeRole(u.id, e.target.value as Role)
                      }
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid #333",
                        background: "#0b0b0b",
                        color: "inherit",
                      }}
                    >
                      <option value="EMPLOYEE">EMPLOYEE</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>

                  <td style={{ padding: "10px 8px" }}>
                    {u.active ? (
                      <span style={{ fontWeight: 700 }}>ACTIVE</span>
                    ) : (
                      <span className="muted">DEACTIVATED</span>
                    )}
                  </td>

                  <td style={{ padding: "10px 8px" }} className="muted">
                    {formatDate(u.createdAt)}
                  </td>

                  <td style={{ padding: "10px 8px" }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {u.active ? (
                        <Button onClick={() => handleToggleActive(u.id, false)}>
                          Deactivate
                        </Button>
                      ) : (
                        <Button onClick={() => handleToggleActive(u.id, true)}>
                          Activate
                        </Button>
                      )}
                      <Button onClick={() => handleDelete(u.id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ padding: "12px 8px" }}
                    className="muted"
                  >
                    Nema rezultata za pretragu.
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
