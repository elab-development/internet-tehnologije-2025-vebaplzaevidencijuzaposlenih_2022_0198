import { describe, it, expect } from "vitest";
import { createUser } from "../helpers/factories";
import { authHeaders } from "../helpers/auth";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

describe("Holidays/Weather - GET smoke", () => {
  it("GET /api/holidays responds (200 or 500)", async () => {
    const admin = await createUser("ADMIN");
    const h = authHeaders({ userId: admin.id, role: admin.role.name });

    const res = await fetch(
      `${BASE}/api/holidays?from=2026-02-24&to=2026-02-28&country=RS`,
      {
        method: "GET",
        headers: { ...h },
      }
    );

    expect([200, 500]).toContain(res.status);

    if (res.status === 200) {
      const json = await res.json();
      expect(json).toBeTruthy();
      expect(Array.isArray(json.holidays)).toBe(true);
    }
  });

  it("GET /api/weather responds (200 or 500)", async () => {
    const admin = await createUser("ADMIN");
    const h = authHeaders({ userId: admin.id, role: admin.role.name });

    const res = await fetch(
      `${BASE}/api/weather?from=2026-02-24&to=2026-02-28`,
      {
        method: "GET",
        headers: { ...h },
      }
    );

    expect([200, 500]).toContain(res.status);

    if (res.status === 200) {
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
    }
  });
});
