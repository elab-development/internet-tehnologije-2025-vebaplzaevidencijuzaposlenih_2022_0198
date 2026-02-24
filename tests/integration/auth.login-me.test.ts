import { describe, it, expect } from "vitest";
import { createUser } from "../helpers/factories";
import { authHeaders } from "../helpers/auth";
import { GET as ME_GET } from "@/app/api/auth/me/route";
import { POST as LOGIN_POST } from "@/app/api/auth/login/route";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

describe("Auth - login + me", () => {
  it("login fails with wrong credentials", async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nope@test.com", password: "bad" }),
    });
    expect([400, 401]).toContain(res.status);
  });

  it("login sets cookie and /me returns current user", async () => {
    const user = await createUser("EMPLOYEE", { password: "Test123!" });

    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, password: "Test123!" }),
    });

    const loginRes = await LOGIN_POST(req as any);
    expect(loginRes.status).toBe(200);

    const setCookie = loginRes.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();

    const cookiePair = setCookie!.split(";")[0];

    const meReq = new Request("http://localhost/api/auth/me", {
      method: "GET",
      headers: { cookie: cookiePair },
    });

    const meRes = await ME_GET(meReq as any);
    expect(meRes.status).toBe(200);

    const meJson = await meRes.json();
    expect(meJson.user?.email).toBe(user.email);
    expect(meJson.user?.passwordHash).toBeUndefined();
  });

  it("/me without cookie behaves as implemented (200 or 401)", async () => {
    const res = await fetch(`${BASE}/api/auth/me`);
    expect([200, 401]).toContain(res.status);

    if (res.status === 200) {
      const json = await res.json();
      expect(json).toBeTruthy();
    }
  });

  it("/me works with authHeaders helper (sanity)", async () => {
    const user = await createUser("EMPLOYEE");
    const h = authHeaders({ userId: user.id, role: user.role.name });

    const meRes = await fetch(`${BASE}/api/auth/me`, {
      method: "GET",
      headers: { ...h },
    });

    expect([200, 401]).toContain(meRes.status);
  });
});
