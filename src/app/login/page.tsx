"use client";

import { useState } from "react";
import Button from "@/components/Button";
import TextField from "@/components/TextField";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import type { UserRole } from "@/lib/types";


function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole>("EMPLOYEE");


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
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

  function handleLogin() {
    setStatusMsg("");
    if (!validate()) return;

    //demo login
    setStatusMsg("Ulogovan (demo). Prebacujem na kalendar...");
    login({ email: email.trim(), role });
    router.push("/calendar");
    
}
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
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontWeight: 700 }}>Role (demo)</label>
            <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                style={{
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


          <div className="row">
            <Button onClick={handleLogin}>Login</Button>
            {statusMsg ? <span className="muted">{statusMsg}</span> : null}
          </div>
        </div>
      </div>
    </main>
  );
}
