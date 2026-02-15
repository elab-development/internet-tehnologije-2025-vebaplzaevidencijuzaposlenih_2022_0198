"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Button from "@/components/Button";
import TextField from "@/components/TextField";
import Modal from "@/components/Modal";
import WfhRequestsAdminCard from "@/components/WfhRequestsAdminCard";

type Role = "EMPLOYEE" | "MANAGER" | "ADMIN";

type UserDTO = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  createdAt: string;
  lastLoginAt: string | null;
};

type WfhReq = {
  id: number;
  date: string; // YYYY-MM-DD
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string | null;
  precipSum: number | null;
  windMax: number | null;
  weatherCode: number | null;
  user: { id: number; firstName: string; lastName: string; email: string };
};

function fullName(u: Pick<UserDTO, "firstName" | "lastName">) {
  return `${u.firstName} ${u.lastName}`.trim();
}
function userLabel(u: WfhReq["user"]) {
  const full = `${u.firstName} ${u.lastName}`.trim();
  return full ? full : u.email;
}

function fmtDateTime(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("sr-RS");
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  // guard
  useEffect(() => {
    if (!user) router.push("/login");
    else if (user.role !== "ADMIN") router.push("/calendar");
  }, [user, router]);

  const [allUsers, setAllUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const [query, setQuery] = useState("");
  const qNorm = query.trim().toLowerCase();
  const [statusType, setStatusType] = useState<"info" | "error">("info");

  // modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserDTO | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserDTO | null>(null);
  const [resetPwUser, setResetPwUser] = useState<UserDTO | null>(null);

  // forms
  const [formFirst, setFormFirst] = useState("");
  const [formLast, setFormLast] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<Role>("EMPLOYEE");

  const [pwValue, setPwValue] = useState("");

  useEffect(() => {
    if (!statusMsg) return;

    const t = setTimeout(() => {
      setStatusMsg("");
    }, 5000);

    return () => clearTimeout(t);
  }, [statusMsg]);

  async function loadUsers() {
    setLoading(true);

    const res = await fetch("/api/users?mode=admin", {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setStatusType("error");
      setStatusMsg(data?.error ?? "Greška pri učitavanju korisnika.");
      setAllUsers([]);
      setLoading(false);
      return;
    }

    const data = await res.json();
    setAllUsers((data.users ?? []) as UserDTO[]);
    setStatusType("info");
    setLoading(false);
  }

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadUsers();
  }, [user?.role]);

  const filtered = useMemo(() => {
    if (!qNorm) return allUsers;
    return allUsers.filter((u) => {
      const name = fullName(u).toLowerCase();
      return (
        name.includes(qNorm) ||
        u.firstName.toLowerCase().includes(qNorm) ||
        u.lastName.toLowerCase().includes(qNorm) ||
        u.email.toLowerCase().includes(qNorm)
      );
    });
  }, [allUsers, qNorm]);

  const employees = useMemo(
    () => filtered.filter((u) => u.role === "EMPLOYEE"),
    [filtered]
  );
  const managers = useMemo(
    () => filtered.filter((u) => u.role === "MANAGER"),
    [filtered]
  );

  const counts = useMemo(() => {
    const total = allUsers.length;
    return { total };
  }, [allUsers]);

  function openAdd() {
    setStatusMsg("");
    setFormFirst("");
    setFormLast("");
    setFormEmail("");
    setFormRole("EMPLOYEE");
    setIsAddOpen(true);
  }

  function openEdit(u: UserDTO) {
    setStatusMsg("");
    setFormFirst(u.firstName);
    setFormLast(u.lastName);
    setFormEmail(u.email);
    setFormRole(u.role);
    setEditUser(u);
  }

  async function submitAdd() {
    setBusy(true);
    setStatusMsg("");
    try {
      const firstName = formFirst.trim();
      const lastName = formLast.trim();
      const email = formEmail.trim().toLowerCase();

      if (!firstName || !lastName || !email) {
        setStatusType("error");
        setStatusMsg("Ime, prezime i email su obavezni.");
        return;
      }
      if (!isEmail(email)) {
        setStatusType("error");
        setStatusMsg("Email format nije ispravan.");
        return;
      }
      if (pwValue.trim().length < 6) {
        setStatusType("error");
        setStatusMsg("Lozinka mora imati bar 6 karaktera.");
        return;
      }

      const res = await fetch("/api/users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          role: formRole,
          password: pwValue.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatusType("error");
        setStatusMsg(data?.error ?? "Greška pri kreiranju korisnika.");
        return;
      }

      setIsAddOpen(false);
      setStatusType("info");
      setStatusMsg("Korisnik kreiran.");
      setPwValue("");
      await loadUsers();
    } finally {
      setBusy(false);
    }
  }

  async function submitEdit() {
    if (!editUser) return;
    setBusy(true);
    setStatusMsg("");
    try {
      const firstName = formFirst.trim();
      const lastName = formLast.trim();
      const email = formEmail.trim().toLowerCase();

      if (!firstName || !lastName || !email) {
        setStatusType("error");
        setStatusMsg("Ime, prezime i email su obavezni.");
        return;
      }
      if (!isEmail(email)) {
        setStatusType("error");
        setStatusMsg("Email format nije ispravan.");
        return;
      }

      const res = await fetch(`/api/users/${editUser.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          role: formRole,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatusType("error");
        setStatusMsg(data?.error ?? "Greška pri izmeni korisnika.");
        return;
      }
      setStatusType("info");
      setStatusMsg("Korisnik izmenjen.");
      setEditUser(null);
      await loadUsers();
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteUser) return;
    setStatusMsg("");
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${deleteUser.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatusType("error");
        setStatusMsg(data?.error ?? "Greška pri brisanju korisnika.");
        return;
      }
      setStatusType("info");
      setStatusMsg("Korisnik izbrisan.");
      setDeleteUser(null);
      await loadUsers();
    } finally {
      setBusy(false);
    }
  }

  async function submitResetPassword() {
    if (!resetPwUser) return;
    setBusy(true);
    setStatusMsg("");
    try {
      const pw = pwValue.trim();
      if (pw.length < 6) {
        setStatusType("error");
        setStatusMsg("Lozinka mora imati bar 6 karaktera.");
        return;
      }

      const res = await fetch(`/api/users/${resetPwUser.id}/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatusType("error");
        setStatusMsg(data?.error ?? "Greška pri resetu lozinke.");
        return;
      }

      setPwValue("");
      setResetPwUser(null);
      setStatusType("info");
      setStatusMsg("Lozinka resetovana.");
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;
  if (user.role !== "ADMIN") return null;

  function UserCardRow({ u }: { u: UserDTO }) {
    return (
      <div
        className="card"
        style={{
          marginTop: 10,
          padding: 12,
          display: "grid",
          gap: 8,
        }}
      >
        <div
          style={{ display: "flex", justifyContent: "space-between", gap: 10 }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                letterSpacing: "-0.01em",
              }}
            >
              {fullName(u)}
            </div>
            <div
              className="muted"
              style={{ overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {u.email}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div className="muted" style={{ marginTop: 2, fontSize: 12 }}>
              Last login: {fmtDateTime(u.lastLoginAt)}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button onClick={() => openEdit(u)}>Izmeni</Button>
          <Button onClick={() => setDeleteUser(u)}>Obriši</Button>
          <Button
            onClick={() => {
              setResetPwUser(u);
              setPwValue("");
            }}
          >
            Resetuj password
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main>
      <h1 className="h1">Admin</h1>
      <p className="h2">Upravljanje korisnicima (DB).</p>

      <WfhRequestsAdminCard />

      {/* Top bar */}
      <div className="card" style={{ marginTop: 16 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <TextField
              label="Pretraga"
              value={query}
              onChange={setQuery}
              placeholder="Ime / prezime / email…"
            />
          </div>

          <div className="muted" style={{ paddingBottom: 2 }}>
            <b>Ukupno:</b> {counts.total}
          </div>

          <div style={{ alignSelf: "flex-end" }}>
            <Button onClick={openAdd}>Kreiraj korisnika</Button>
          </div>
        </div>

        {statusMsg ? (
          <div
            className={`notice ${statusType === "error" ? "notice-error" : ""}`}
            style={{ marginTop: 10 }}
          >
            {statusMsg}
          </div>
        ) : null}
      </div>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <div className="card">
          <div
            style={{ display: "flex", justifyContent: "space-between", gap: 8 }}
          >
            <h2 className="sectionTitle" style={{ margin: 0 }}>
              Radnici
            </h2>
            <span className="muted">
              Prikaz: <b>{employees.length}</b>
            </span>
          </div>

          {loading ? (
            <div className="muted" style={{ marginTop: 12 }}>
              Učitavam…
            </div>
          ) : employees.length === 0 ? (
            <div className="muted" style={{ marginTop: 12 }}>
              Nema rezultata.
            </div>
          ) : (
            <div style={{ marginTop: 12 }}>
              {employees.map((u) => (
                <UserCardRow key={u.id} u={u} />
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div
            style={{ display: "flex", justifyContent: "space-between", gap: 8 }}
          >
            <h2 className="sectionTitle" style={{ margin: 0 }}>
              Menadžeri
            </h2>
            <span className="muted">
              Prikaz: <b>{managers.length}</b>
            </span>
          </div>

          {loading ? (
            <div className="muted" style={{ marginTop: 12 }}>
              Učitavam…
            </div>
          ) : managers.length === 0 ? (
            <div className="muted" style={{ marginTop: 12 }}>
              Nema rezultata.
            </div>
          ) : (
            <div style={{ marginTop: 12 }}>
              {managers.map((u) => (
                <UserCardRow key={u.id} u={u} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ADD modal */}
      {isAddOpen ? (
        <Modal
          open={isAddOpen}
          title="Kreiraj korisnika"
          onClose={() => {
            setIsAddOpen(false);
            setPwValue("");
          }}
        >
          <div style={{ display: "grid", gap: 12 }}>
            {statusMsg ? (
              <div
                className={`notice ${
                  statusType === "error" ? "notice-error" : ""
                }`}
              >
                {statusMsg}
              </div>
            ) : null}

            <TextField label="Ime" value={formFirst} onChange={setFormFirst} />
            <TextField
              label="Prezime"
              value={formLast}
              onChange={setFormLast}
            />
            <TextField
              label="Email"
              value={formEmail}
              onChange={setFormEmail}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontWeight: 700 }}>Uloga</label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as Role)}
                className="select"
              >
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="MANAGER">MANAGER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <TextField
              label="Lozinka (inicijalna)"
              value={pwValue}
              onChange={setPwValue}
              placeholder="min. 6 karaktera"
            />

            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <Button
                onClick={() => {
                  setIsAddOpen(false);
                  setPwValue("");
                }}
              >
                Poništi
              </Button>
              <Button onClick={submitAdd}>Kreiraj</Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* EDIT modal */}
      {editUser ? (
        <Modal
          open={!!editUser}
          title="Edit user"
          onClose={() => setEditUser(null)}
        >
          <div style={{ display: "grid", gap: 12 }}>
            {statusMsg ? (
              <div
                className={`notice ${
                  statusType === "error" ? "notice-error" : ""
                }`}
              >
                {statusMsg}
              </div>
            ) : null}

            <div className="muted">
              ID: <b>{editUser.id}</b> | Kreiran:{" "}
              <b>{fmtDateTime(editUser.createdAt)}</b>
            </div>

            <TextField label="Ime" value={formFirst} onChange={setFormFirst} />
            <TextField
              label="Prezime"
              value={formLast}
              onChange={setFormLast}
            />
            <TextField
              label="Email"
              value={formEmail}
              onChange={setFormEmail}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label>Uloga</label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as Role)}
                className="select"
              >
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="MANAGER">MANAGER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <Button onClick={() => setEditUser(null)}>Cancel</Button>
              <Button onClick={submitEdit}>Save</Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* DELETE confirm modal */}
      {deleteUser ? (
        <Modal
          open={!!deleteUser}
          title="Potvrdi brisanje"
          onClose={() => setDeleteUser(null)}
        >
          <div style={{ display: "grid", gap: 12 }}>
            {statusMsg ? (
              <div
                className={`notice ${
                  statusType === "error" ? "notice-error" : ""
                }`}
              >
                {statusMsg}
              </div>
            ) : null}

            <div>
              Da li si siguran da želiš da obrišeš korisnika:
              <div style={{ marginTop: 8 }}>
                <b>{fullName(deleteUser)}</b> ({deleteUser.email})
              </div>
              <div className="muted" style={{ marginTop: 6 }}>
                Ako postoje aktivnosti/prisustva, brisanje može biti blokirano —
                u tom slučaju deaktiviraj.
              </div>
            </div>

            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <Button onClick={() => setDeleteUser(null)}>Cancel</Button>
              <Button onClick={confirmDelete}>Delete</Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* RESET PASSWORD modal */}
      {resetPwUser ? (
        <Modal
          open={!!resetPwUser}
          title="Reset password"
          onClose={() => {
            setResetPwUser(null);
            setPwValue("");
          }}
        >
          <div style={{ display: "grid", gap: 12 }}>
            {statusMsg ? (
              <div
                className={`notice ${
                  statusType === "error" ? "notice-error" : ""
                }`}
              >
                {statusMsg}
              </div>
            ) : null}

            <div>
              Reset lozinke za: <b>{fullName(resetPwUser)}</b>
              <div className="muted">{resetPwUser.email}</div>
            </div>

            <TextField
              label="Nova lozinka"
              value={pwValue}
              onChange={setPwValue}
              placeholder="min 6 karaktera"
            />

            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <Button
                onClick={() => {
                  setResetPwUser(null);
                  setPwValue("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={submitResetPassword}>Reset</Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </main>
  );
}
