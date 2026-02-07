"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import TextField from "@/components/TextField";
import { useAuth } from "@/components/AuthProvider";
import type { UserRole } from "@/lib/types";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [firstNameError, setFirstNameError] = useState<string | undefined>();
  const [lastNameError, setLastNameError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [statusMsg, setStatusMsg] = useState<string>("");

  function validate() {
    let ok = true;

    if (!firstName.trim()) {
      setFirstNameError("Ime je obavezno.");
      ok = false;
    } else {
      setFirstNameError(undefined);
    }

    if (!lastName.trim()) {
      setLastNameError("Prezime je obavezno.");
      ok = false;
    } else {
      setLastNameError(undefined);
    }

    const e = email.trim();
    if (!e) {
      setEmailError("Email je obavezan.");
      ok = false;
    } else if (!isValidEmail(e)) {
      setEmailError("Email format nije ispravan.");
      ok = false;
    } else {
      setEmailError(undefined);
    }

    if (!password) {
      setPasswordError("Lozinka je obavezna.");
      ok = false;
    } else if (password.length < 6) {
      setPasswordError("Lozinka mora imati bar 6 karaktera.");
      ok = false;
    } else {
      setPasswordError(undefined);
    }

    return ok;
  }

  async function handleRegister() {
    setStatusMsg("");
    if (!validate()) return;

    setStatusMsg("Kreiram nalog...");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setStatusMsg(data?.error ?? "Registracija nije uspela.");
      return;
    }

    // backend vraća: { user: { id, email, role } } (pretpostavka: EMPLOYEE default)
    const u = data?.user;
    if (!u?.email || !u?.role) {
      setStatusMsg("Registracija uspela, ali odgovor servera je neispravan.");
      return;
    }

    await refresh();

    setStatusMsg("Nalog kreiran. Prebacujem...");
    router.push("/attendance");
  }

  return (
    <main>
      <h1 className="h1">Register</h1>
      <p className="h2">Kreiraj nalog da koristiš evidenciju prisustva.</p>

      <div className="card" style={{ maxWidth: 420, marginTop: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <TextField
            label="Ime"
            value={firstName}
            onChange={setFirstName}
            placeholder="npr. Marko"
            error={firstNameError}
          />

          <TextField
            label="Prezime"
            value={lastName}
            onChange={setLastName}
            placeholder="npr. Marković"
            error={lastNameError}
          />

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="npr. marko@mail.com"
            error={emailError}
          />

          <TextField
            label="Lozinka"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••"
            error={passwordError}
          />

          <div className="row">
            <Button onClick={handleRegister}>Register</Button>
            {statusMsg ? <span className="muted">{statusMsg}</span> : null}
          </div>

          <div className="muted" style={{ marginTop: 6 }}>
            Već imaš nalog?{" "}
            <a href="/login" style={{ textDecoration: "underline" }}>
              Uloguj se
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
