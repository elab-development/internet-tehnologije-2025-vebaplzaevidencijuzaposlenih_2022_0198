"use client";

import { useState } from "react";
import Button from "@/components/Button";
import TextField from "@/components/TextField";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

//React komponenta
export default function LoginPage() {
  //2 hooka
  const router = useRouter();
  const { refresh } = useAuth();

  //state forme
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  //ui feedback state
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(
    undefined
  );
  const [statusMsg, setStatusMsg] = useState<string>("");

  function validate() {
    let ok = true;

    if (!email.trim()) {
      setEmailError("Email je obavezan.");
      ok = false;
    } else if (!isValidEmail(email.trim())) {
      setEmailError("Email format nije ispravan.");
      ok = false;
    } else {
      setEmailError(undefined);
    }

    if (!password) {
      setPasswordError("Lozinka je obavezna.");
      ok = false;
    } else if (password.length < 4) {
      setPasswordError("Lozinka mora imati bar 4 karaktera.");
      ok = false;
    } else {
      setPasswordError(undefined);
    }

    return ok;
  }

  async function handleLogin() {
    setStatusMsg("");
    if (!validate()) return;

    setStatusMsg("Ulogujem...");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setStatusMsg(data?.error ?? "Login nije uspeo.");
      return;
    }

    // backend vraća user: { id, email, role }
    await refresh();

    setStatusMsg("Ulogovan. Prebacujem...");
    router.push("/attendance");
  }

  //sta se vidi na ekranu:
  return (
    <main>
      <h1 className="h1">Login</h1>
      <p className="h2">Unesi email i lozinku da pristupiš kalendaru.</p>

      <div className="card" style={{ maxWidth: 420, marginTop: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
            placeholder="••••"
            error={passwordError}
          />

          <p className="muted">
            Nemaš nalog?{" "}
            <Link href="/register" style={{ textDecoration: "underline" }}>
              Registruj se ovde
            </Link>
          </p>

          <div className="row">
            <Button onClick={handleLogin}>Login</Button>
            {statusMsg ? <span className="muted">{statusMsg}</span> : null}
          </div>
        </div>
      </div>
    </main>
  );
}
