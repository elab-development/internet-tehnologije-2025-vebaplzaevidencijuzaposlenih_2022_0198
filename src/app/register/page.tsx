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
  const [showPassword, setShowPassword] = useState(false);

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
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1 className="h1">Register</h1>
      <p className="h2">Kreiraj nalog da koristiš evidenciju prisustva.</p>

      <div
        className="card"
        style={{ maxWidth: 560, width: "100%", marginTop: 16 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
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

          <div style={{ position: "relative" }}>
            <TextField
              label="Lozinka"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={setPassword}
              placeholder="••••"
              error={passwordError}
            />

            <img
              src={
                showPassword
                  ? "/icons/password-eye/eye-off.svg"
                  : "/icons/password-eye/eye-on.svg"
              }
              alt="Toggle password visibility"
              onClick={() => setShowPassword((s) => !s)}
              style={{
                position: "absolute",
                right: 12,
                top: 40,
                width: 20,
                height: 20,
                cursor: "pointer",
                opacity: 0.7,
              }}
            />
          </div>

          <div className="row">
            <Button onClick={handleRegister}>Registeruj se</Button>
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
      <img
        src="/slides/stickmans-line.png"
        alt="Login ilustracija"
        style={{
          marginTop: 0,
          maxWidth: 1200,
          width: "100%",
          opacity: 0.9,
        }}
      />
    </main>
  );
}
