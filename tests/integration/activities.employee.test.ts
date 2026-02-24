import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/activities/route";
import { createUser, createActivity } from "../helpers/factories";
import { makeAuthCookie } from "../helpers/auth";

describe("GET /api/activities (EMPLOYEE)", () => {
  it("returns only employee's activities", async () => {
    const emp = await createUser("EMPLOYEE");
    const other = await createUser("EMPLOYEE"); // drugi user

    await createActivity({ userId: emp.id, date: "2026-02-23", name: "Emp A" });
    await createActivity({
      userId: other.id,
      date: "2026-02-23",
      name: "Other B",
    });

    const cookie = makeAuthCookie({
      userId: emp.id,
      role: "EMPLOYEE",
    });

    const req = new Request(
      "http://localhost/api/activities?from=2026-02-23&to=2026-02-23",
      { method: "GET", headers: { cookie } }
    );

    const res = await GET(req as any);
    expect(res.status).toBe(200);

    const body = await res.json();
    const items = Array.isArray(body)
      ? body
      : body.activities ?? body.data ?? body.items;

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(1);
    expect(items[0].name).toBe("Emp A");
  });
});
